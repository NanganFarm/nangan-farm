import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

import { useAuth } from './AuthContext';

const FarmContext = createContext();

export const FarmProvider = ({ children }) => {
    const [farms, setFarms] = useState([]);
    const [currentFarm, setCurrentFarm] = useState(null);
    const [cycles, setCycles] = useState([]);
    const [currentCycle, setCurrentCycle] = useState(null);
    const [zones, setZones] = useState([]);
    const [currentZone, setCurrentZone] = useState(null);
    const [loading, setLoading] = useState(true);

    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser) {
            loadFarms();
        } else {
            setFarms([]);
            setCurrentFarm(null);
            setLoading(false);
        }
    }, [currentUser]);



    useEffect(() => {
        if (currentFarm) {
            loadCycles(currentFarm.id);
            loadZones(currentFarm.id);
            setCurrentZone(null); // Reset zone when switching farm
        } else {
            setCycles([]);
            setZones([]);
            setCurrentZone(null);
        }
    }, [currentFarm]);

    // Filter cycles based on current zone (or lack thereof)
    const filteredCycles = cycles.filter(cycle => {
        if (currentZone) {
            return cycle.zoneId === currentZone.id;
        }
        return !cycle.zoneId; // Main farm cycles have no zoneId
    });

    // Ensure currentCycle belongs to the current context
    useEffect(() => {
        if (filteredCycles.length > 0) {
            // If currentCycle is not in the filtered list, switch to the first one
            if (!currentCycle || !filteredCycles.find(c => c.id === currentCycle.id)) {
                const active = filteredCycles.find(c => c.status === 'active');
                setCurrentCycle(active || filteredCycles[filteredCycles.length - 1]);
            }
        } else {
            setCurrentCycle(null);
        }
    }, [currentZone, cycles]); // Re-run when zone or cycles change

    const loadFarms = async () => {
        if (!currentUser) return;
        try {
            const data = await api.getFarms(currentUser.id);
            setFarms(data);
            if (data.length > 0) {
                const savedFarmId = localStorage.getItem('currentFarmId');
                const savedFarm = data.find(f => f.id === savedFarmId);
                setCurrentFarm(savedFarm || data[0]);
            } else {
                setCurrentFarm(null);
            }
        } catch (error) {
            console.error("Failed to load farms:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCycles = async (farmId) => {
        try {
            const data = await api.getCycles(farmId);
            setCycles(data);
        } catch (error) {
            console.error("Failed to load cycles:", error);
        }
    };

    const loadZones = async (farmId) => {
        try {
            const data = await api.getZones(farmId);
            setZones(data);
        } catch (error) {
            console.error("Failed to load zones:", error);
        }
    };

    const switchFarm = (farmId) => {
        const farm = farms.find(f => f.id === farmId);
        if (farm) {
            setCurrentFarm(farm);
            localStorage.setItem('currentFarmId', farm.id);
        }
    };

    const enterZone = (zone) => {
        setCurrentZone(zone);
    };

    const switchZone = (zoneId) => {
        if (!zoneId) {
            setCurrentZone(null);
            return;
        }
        const zone = zones.find(z => z.id === zoneId);
        if (zone) {
            setCurrentZone(zone);
        }
    };

    const exitZone = () => {
        setCurrentZone(null);
    };

    const addFarm = async (farmData) => {
        if (!currentUser) throw new Error("You must be logged in to add a farm.");
        // Remove local ID generation, let Firestore generate it
        const savedFarm = await api.addFarm(farmData, currentUser.id);
        setFarms([...farms, savedFarm]);
        setCurrentFarm(savedFarm);
        localStorage.setItem('currentFarmId', savedFarm.id);
        return savedFarm;
    };

    const updateFarm = async (farmId, updates) => {
        try {
            const updatedFarm = await api.updateFarm(farmId, updates);
            setFarms(farms.map(f => f.id === farmId ? updatedFarm : f));
            if (currentFarm?.id === farmId) {
                setCurrentFarm(updatedFarm);
            }
            return updatedFarm;
        } catch (error) {
            console.error("Failed to update farm:", error);
            throw error;
        }
    };

    const deleteFarm = async (farmId) => {
        try {
            await api.deleteFarm(farmId);
            const updatedFarms = farms.filter(f => f.id !== farmId);
            setFarms(updatedFarms);

            if (updatedFarms.length > 0) {
                setCurrentFarm(updatedFarms[0]);
                localStorage.setItem('currentFarmId', updatedFarms[0].id);
            } else {
                setCurrentFarm(null);
                localStorage.removeItem('currentFarmId');
            }
        } catch (error) {
            console.error("Failed to delete farm:", error);
        }
    };

    const addZone = async (zoneData) => {
        if (!currentUser) throw new Error("User not logged in");
        const newZone = {
            ...zoneData,
            farmId: currentFarm.id,
            userId: currentUser.id
        };
        const savedZone = await api.addZone(newZone);
        setZones([...zones, savedZone]);
        return savedZone;
    };

    const updateZone = async (zoneId, updates) => {
        try {
            const updatedZone = await api.updateZone(zoneId, updates);
            setZones(zones.map(z => z.id === zoneId ? updatedZone : z));
            if (currentZone?.id === zoneId) {
                setCurrentZone(updatedZone);
            }
        } catch (error) {
            console.error("Failed to update zone:", error);
            throw error;
        }
    };

    const deleteZone = async (zoneId) => {
        try {
            await api.deleteZone(zoneId);
            setZones(zones.filter(z => z.id !== zoneId));
            if (currentZone?.id === zoneId) {
                exitZone();
            }
        } catch (error) {
            console.error("Failed to delete zone:", error);
        }
    };

    const switchCycle = (cycleId) => {
        const cycle = cycles.find(c => c.id === cycleId);
        if (cycle) {
            setCurrentCycle(cycle);
        }
    };

    const createCycle = async (cycleData) => {
        if (!currentUser) throw new Error("User not logged in");
        // Check if there is already an active cycle for this zone
        const activeCycle = cycles.find(c => c.zoneId === currentZone?.id && c.status === 'active');
        if (activeCycle) {
            throw new Error("An active cycle already exists for this zone. Please end the current cycle before starting a new one.");
        }

        // Fetch stages to get the correct ID
        const stages = await api.getStages();
        const plantingStage = stages.find(s => s.name === 'Planting');
        const firstStage = stages.find(s => s.order === 1) || stages[0];

        const newCycle = {
            ...cycleData,
            farmId: currentFarm.id,
            zoneId: currentZone?.id || null, // Associate with zone if active
            userId: currentUser.id,
            status: 'active',
            currentStageId: cycleData.type === 'ratoon'
                ? (plantingStage?.id || firstStage?.id)
                : firstStage?.id
        };
        const savedCycle = await api.addCycle(newCycle);
        setCycles([...cycles, savedCycle]);
        setCurrentCycle(savedCycle);
        return savedCycle;
    };

    const updateCycleStage = async (stageId) => {
        console.log("updateCycleStage called with:", stageId);
        if (!currentCycle) {
            console.error("No current cycle");
            return;
        }

        try {
            const updatedCycle = { ...currentCycle, currentStageId: stageId };
            console.log("Updating cycle via API...", currentCycle.id, { currentStageId: stageId });
            await api.updateCycle(currentCycle.id, { currentStageId: stageId });

            // Log stage transition
            await api.logStageTransition(currentCycle.id, stageId);

            console.log("API update success");

            setCycles(cycles.map(c => c.id === currentCycle.id ? updatedCycle : c));
            setCurrentCycle(updatedCycle);
        } catch (error) {
            console.error("Failed to update cycle stage:", error);
        }
    };

    const endCycle = async (cycleId, millingData) => {
        try {
            // 1. Upload Receipts
            const receiptUrls = [];
            if (millingData.receiptFiles && millingData.receiptFiles.length > 0) {
                for (const file of millingData.receiptFiles) {
                    const path = `${cycleId}/${Date.now()}_${file.name}`;
                    const url = await api.uploadFile(file, 'receipts', path);
                    receiptUrls.push(url);
                }
            }

            // 2. Create Milling Record
            const millingRecord = {
                cycleId,
                lkgPerTon: millingData.lkgPerTon,
                sugarPrice: millingData.sugarPrice,
                plantersSharePercent: millingData.plantersSharePercent,
                netAmount: millingData.netAmount,
                grossAmount: millingData.grossAmount || 0, // Calculate if needed, or pass 0
                millingDate: new Date().toISOString(),
                receiptUrls
            };
            await api.createMillingRecord(millingRecord);

            // 3. Update Cycle Status
            const updatedCycle = {
                ...currentCycle,
                status: 'completed',
                endDate: new Date().toISOString().split('T')[0],
                // We don't store milling data directly in cycle anymore, but maybe a flag or reference?
                // For now, let's keep it clean.
            };
            await api.updateCycle(cycleId, {
                status: 'completed',
                endDate: updatedCycle.endDate
            });

            setCycles(cycles.map(c => c.id === cycleId ? updatedCycle : c));
            setCurrentCycle(null); // Clear current cycle as it is now ended
        } catch (error) {
            console.error("Failed to end cycle:", error);
            throw error;
        }
    };

    const deleteCycle = async (cycleId) => {
        try {
            await api.deleteCycle(cycleId);
            const updatedCycles = cycles.filter(c => c.id !== cycleId);
            setCycles(updatedCycles);

            if (currentCycle && currentCycle.id === cycleId) {
                // Logic handled by useEffect now
            }
        } catch (error) {
            console.error("Failed to delete cycle:", error);
        }
    };

    return (
        <FarmContext.Provider value={{
            farms,
            currentFarm,
            switchFarm,
            addFarm,
            updateFarm,
            deleteFarm,
            cycles: filteredCycles, // Expose filtered cycles
            currentCycle,
            switchCycle,
            createCycle,
            updateCycleStage,
            endCycle,
            deleteCycle,
            zones,
            currentZone, // Expose currentZone
            enterZone,   // Expose enterZone
            switchZone,  // Expose switchZone
            exitZone,    // Expose exitZone
            addZone,
            updateZone,
            deleteZone,
            loading
        }}>
            {children}
        </FarmContext.Provider>
    );
};


export const useFarm = () => {
    const context = useContext(FarmContext);
    if (!context) {
        throw new Error('useFarm must be used within a FarmProvider');
    }
    return context;
};
