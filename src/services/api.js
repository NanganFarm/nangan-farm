import { supabase } from '../supabaseClient';

export const api = {
    _debug: console.log("API Service Initialized"),
    // Farm Operations
    async getFarms(userId) {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('farms')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    },

    async addFarm(farm, userId) {
        if (!userId) throw new Error("User ID is required.");
        const { data, error } = await supabase
            .from('farms')
            .insert([{ ...farm, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteFarm(id) {
        // 1. Delete Expenses
        const { error: expenseError } = await supabase
            .from('expenses')
            .delete()
            .eq('farm_id', id);
        if (expenseError) throw expenseError;

        // 2. Delete Cycles
        const { error: cycleError } = await supabase
            .from('cycles')
            .delete()
            .eq('farm_id', id);
        if (cycleError) throw cycleError;

        // 3. Delete Zones
        const { error: zoneError } = await supabase
            .from('zones')
            .delete()
            .eq('farm_id', id);
        if (zoneError) throw zoneError;

        // 4. Delete Farm
        const { error } = await supabase
            .from('farms')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Zone Operations
    async getZones(farmId) {
        const { data, error } = await supabase
            .from('zones')
            .select('*')
            .eq('farm_id', farmId);

        if (error) throw error;
        return data;
    },

    async addZone(zone) {
        // Map camelCase to snake_case for DB if needed, but we used snake_case in SQL
        // However, our frontend sends camelCase (farmId). We need to map it.
        const dbZone = {
            name: zone.name,
            area: zone.area,
            farm_id: zone.farmId,
            user_id: zone.userId // Ensure userId is passed or handled by RLS/Trigger (RLS needs it in insert)
        };

        // Actually, our SQL RLS checks auth.uid() = user_id, so we must include user_id in the insert
        // But wait, RLS 'with check' validates the row being inserted.
        // So we must send user_id.

        // Let's assume the frontend passes a zone object that might need transformation
        // Or we can just pass what we have if the frontend is updated. 
        // For now, let's map explicitly to be safe.

        // Wait, the previous api.js didn't require userId for addZone? 
        // Ah, FarmContext.jsx:81: const newZone = { ...zoneData, farmId: currentFarm.id };
        // It doesn't add userId. We need to fix FarmContext to pass userId to addZone too, 
        // OR we can get it from the session here? No, api.js is stateless.
        // We should update FarmContext to pass userId to all add* functions.

        // For now, let's assume the caller will pass the correct structure or we fix it in Context.
        // Let's standardize on snake_case for the DB.

        const { data, error } = await supabase
            .from('zones')
            .insert([
                {
                    name: zone.name,
                    area: parseFloat(zone.area.toString().replace(/[^0-9.]/g, '')) || 0, // Sanitize area
                    farm_id: zone.farmId,
                    user_id: zone.userId, // We need to ensure this is passed
                    location: zone.location,
                    crop: zone.crop,
                    coordinates: zone.coordinates ? JSON.stringify(zone.coordinates) : null
                }
            ])
            .select()
            .single();

        if (error) throw error;
        // Map back to camelCase for frontend?
        // The frontend expects 'id', 'name', 'farmId'. 
        // Supabase returns 'id', 'name', 'farm_id'.
        // We should normalize the return.
        return {
            ...data,
            farmId: data.farm_id,
            userId: data.user_id,
            location: data.location,
            crop: data.crop,
            coordinates: data.coordinates
        };
    },

    async updateZone(id, updates) {
        // Map updates to snake_case
        const dbUpdates = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.area) dbUpdates.area = parseFloat(updates.area.toString().replace(/[^0-9.]/g, '')) || 0; // Sanitize area
        if (updates.location) dbUpdates.location = updates.location;
        if (updates.crop) dbUpdates.crop = updates.crop;
        if (updates.coordinates) dbUpdates.coordinates = JSON.stringify(updates.coordinates);

        const { data, error } = await supabase
            .from('zones')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            farmId: data.farm_id,
            userId: data.user_id,
            location: updates.location || data.location, // Return it back
            crop: updates.crop || data.crop // Return it back
        };
    },

    async deleteZone(id) {
        const { error } = await supabase
            .from('zones')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Cycle Operations
    async getCycles(farmId) {
        const { data, error } = await supabase
            .from('cycles')
            .select('*, milling_records(*), cycle_stage_history(*, stages(name))')
            .eq('farm_id', farmId);

        if (error) throw error;
        return data.map(c => ({
            ...c,
            farmId: c.farm_id,
            zoneId: c.zone_id,
            userId: c.user_id,
            startDate: c.start_date,
            endDate: c.end_date,
            currentStageId: c.current_stage_id,
            milling: c.milling_records && c.milling_records.length > 0 ? {
                lkgPerTon: c.milling_records[0].lkg_per_ton,
                sugarPrice: c.milling_records[0].sugar_price,
                plantersSharePercent: c.milling_records[0].planters_share_percent,
                netAmount: c.milling_records[0].net_amount,
                grossAmount: c.milling_records[0].gross_amount,
                millingDate: c.milling_records[0].milling_date,
                receiptUrls: c.milling_records[0].receipt_urls
            } : null,
            stageHistory: c.cycle_stage_history ? c.cycle_stage_history.map(h => ({
                id: h.id,
                stageId: h.stage_id,
                stageName: h.stages?.name || 'Unknown Stage',
                enteredAt: h.entered_at
            })).sort((a, b) => new Date(a.enteredAt) - new Date(b.enteredAt)) : []
        }));
    },

    async logStageTransition(cycleId, stageId) {
        const { error } = await supabase
            .from('cycle_stage_history')
            .insert([{
                cycle_id: cycleId,
                stage_id: stageId
            }]);

        if (error) console.error("Failed to log stage transition:", error);
    },

    async addCycle(cycle) {
        const dbCycle = {
            name: cycle.name,
            type: cycle.type,
            status: cycle.status,
            start_date: cycle.startDate,
            farm_id: cycle.farmId,
            zone_id: cycle.zoneId,
            user_id: cycle.userId, // Need to ensure this is passed
            current_stage_id: cycle.currentStageId
        };

        const { data, error } = await supabase
            .from('cycles')
            .insert([dbCycle])
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            farmId: data.farm_id,
            zoneId: data.zone_id,
            userId: data.user_id,
            startDate: data.start_date,
            endDate: data.end_date,
            currentStageId: data.current_stage_id
        };
    },

    async updateCycle(id, updates) {
        const dbUpdates = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.currentStageId) dbUpdates.current_stage_id = updates.currentStageId;
        if (updates.endDate) dbUpdates.end_date = updates.endDate;
        if (updates.milling) dbUpdates.milling = updates.milling;

        const { data, error } = await supabase
            .from('cycles')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            console.warn(`Update cycle failed: Cycle ${id} not found or permission denied.`);
            throw new Error(`Cycle not found or permission denied (ID: ${id})`);
        }

        return {
            ...data,
            farmId: data.farm_id,
            zoneId: data.zone_id,
            userId: data.user_id,
            startDate: data.start_date,
            endDate: data.end_date,
            currentStageId: data.current_stage_id
        };
    },

    async deleteCycle(id) {
        const { error } = await supabase
            .from('cycles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Expense Operations
    async getExpenses(farmId, cycleId) {
        let query = supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

        if (cycleId) {
            query = query.eq('cycle_id', cycleId);
        } else if (farmId) {
            query = query.eq('farm_id', farmId);
        } else {
            return [];
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map(e => ({
            ...e,
            farmId: e.farm_id,
            cycleId: e.cycle_id,
            userId: e.user_id,
            stageId: e.stage_id,
            costPerUnit: e.cost_per_unit,
            receiptUrl: e.receipt_url
        }));
    },

    async addExpense(expense) {
        const dbExpense = {
            farm_id: expense.farmId,
            cycle_id: expense.cycleId,
            user_id: expense.userId,
            date: expense.date,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            unit: expense.unit,
            quantity: expense.quantity,
            cost_per_unit: expense.costPerUnit,
            stage_id: expense.stageId,
            receipt_url: expense.receiptUrl || expense.receiptImage // Handle both naming conventions
        };

        const { data, error } = await supabase
            .from('expenses')
            .insert([dbExpense])
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            farmId: data.farm_id,
            cycleId: data.cycle_id,
            userId: data.user_id,
            stageId: data.stage_id,
            costPerUnit: data.cost_per_unit,
            receiptUrl: data.receipt_url
        };
    },

    async updateExpense(id, updates) {
        // Simple mapping for now, assuming updates keys match what we expect or we map them
        // For safety, let's map commonly updated fields
        const dbUpdates = {};
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.amount) dbUpdates.amount = updates.amount;
        if (updates.receiptImage) dbUpdates.receipt_url = updates.receiptImage;
        if (updates.stageId) dbUpdates.stage_id = updates.stageId;
        // ... add others as needed

        const { data, error } = await supabase
            .from('expenses')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            farmId: data.farm_id,
            cycleId: data.cycle_id,
            userId: data.user_id,
            stageId: data.stage_id,
            costPerUnit: data.cost_per_unit,
            receiptUrl: data.receipt_url
        };
    },

    async deleteExpense(id) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Stages
    async getStages() {
        try {
            const { data, error } = await supabase
                .from('stages')
                .select('*')
                .order('order', { ascending: true });

            if (error) {
                // If table is missing (404), we can't insert. Just return defaults.
                if (error.code === '404' || error.message?.includes('Not Found')) {
                    console.warn("Stages table not found. Using defaults.");
                    return DEFAULT_STAGES;
                }
                throw error;
            }

            if (!data || data.length === 0) {
                console.log("Seeding default stages...");
                const { data: inserted, error: insertError } = await supabase
                    .from('stages')
                    .insert(DEFAULT_STAGES)
                    .select();

                if (insertError) {
                    // If insert fails (e.g. table missing), return defaults
                    console.warn("Failed to seed stages. Using defaults.", insertError);
                    return DEFAULT_STAGES;
                }
                return inserted;
            }
            return data;
        } catch (error) {
            console.warn("Using default stages due to error:", error);
            return DEFAULT_STAGES;
        }
    },

    // Categories
    async getCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*');

            if (error) throw error;

            if (!data || data.length === 0) {
                console.log("Seeding default categories...");
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await this._materializeDefaults(user.id);
                    // Re-fetch to get the generated IDs
                    const { data: refetched } = await supabase
                        .from('categories')
                        .select('*');
                    return refetched;
                }
                return DEFAULT_CATEGORIES;
            }
            return data;
        } catch (error) {
            console.warn("Using default categories due to error:", error);
            return DEFAULT_CATEGORIES;
        }
    },

    async _materializeDefaults(userId, excludeId = null) {
        // 1. Fetch existing categories for this user to avoid duplicates
        const { data: existing, error: fetchError } = await supabase
            .from('categories')
            .select('name')
            .eq('user_id', userId);

        if (fetchError) {
            console.error("Error checking existing categories:", fetchError);
            throw fetchError;
        }

        const existingNames = new Set(existing?.map(c => c.name) || []);

        // 2. Filter defaults: Exclude the one being edited/deleted AND those that already exist
        const toInsert = DEFAULT_CATEGORIES
            .filter(c => c.id !== excludeId && !existingNames.has(c.name))
            .map(c => ({
                name: c.name,
                type: c.type, // Include type
                user_id: userId
            }));

        if (toInsert.length === 0) return;

        // 3. Insert missing defaults
        const { error } = await supabase
            .from('categories')
            .insert(toInsert);

        if (error) throw error;
    },

    async addCategory(category) {
        // 1. Check if we are in "Default Mode" (empty DB)
        const { count } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true });

        if (count === 0) {
            // Materialize defaults first so we don't lose them
            await this._materializeDefaults(category.userId);
        }

        const { data, error } = await supabase
            .from('categories')
            .insert([{ name: category.name, user_id: category.userId }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateCategory(id, updates) {
        // Check if it's a default category (id starts with "cat_")
        if (typeof id === 'string' && id.startsWith('cat_')) {
            // We can't update a virtual category. We must materialize defaults first.
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not logged in");

            // Materialize all defaults EXCEPT the one we are "updating" (which we will insert as new with new name)
            await this._materializeDefaults(user.id, id);

            // Now insert the updated one as a new record
            const { data, error } = await supabase
                .from('categories')
                .insert([{ name: updates.name, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        const { data, error } = await supabase
            .from('categories')
            .update({ name: updates.name })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteCategory(id) {
        // Check if it's a default category
        if (typeof id === 'string' && id.startsWith('cat_')) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not logged in");

            // Materialize all defaults EXCEPT this one
            await this._materializeDefaults(user.id, id);
            return; // Done. The "deleted" one is simply not inserted.
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async resetCategories(userId) {
        if (!userId) throw new Error("User ID required");

        // 1. Delete all categories for this user
        const { error: deleteError } = await supabase
            .from('categories')
            .delete()
            .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // 2. Restore defaults
        await this._materializeDefaults(userId);
    },

    async resetStages() {
        // Warning: This affects all users if stages are global. 
        // Assuming single-tenant or isolated environment for now based on user request.
        const { error: deleteError } = await supabase
            .from('stages')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq is a hack if no ID known, or just use empty filter if allowed)
        // Better: .gt('id', '0') or something if IDs are UUIDs. 
        // Actually, if we just want to reset, we can try deleting all.

        // Supabase might block 'delete all' without filter. 
        // Let's fetch IDs first then delete.
        const { data: stages } = await supabase.from('stages').select('id');
        if (stages && stages.length > 0) {
            const ids = stages.map(s => s.id);
            const { error } = await supabase.from('stages').delete().in('id', ids);
            if (error) throw error;
        }

        // Insert defaults
        const { error: insertError } = await supabase
            .from('stages')
            .insert(DEFAULT_STAGES);

        if (insertError) throw insertError;
    },

    // Milling Records
    async createMillingRecord(record) {
        const dbRecord = {
            cycle_id: record.cycleId,
            lkg_per_ton: record.lkgPerTon,
            sugar_price: record.sugarPrice,
            planters_share_percent: record.plantersSharePercent,
            net_amount: record.netAmount,
            gross_amount: record.grossAmount,
            milling_date: record.millingDate,
            receipt_urls: record.receiptUrls
        };

        const { data, error } = await supabase
            .from('milling_records')
            .insert([dbRecord])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Storage
    async uploadFile(file, bucket, path) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    }
};

const DEFAULT_CATEGORIES = [
    { "id": "cat_1", "name": "Labor", "type": "variable" },
    { "id": "cat_2", "name": "Fertilizer", "type": "variable" },
    { "id": "cat_3", "name": "Equipment", "type": "fixed" },
    { "id": "cat_4", "name": "Seeds", "type": "variable" },
    { "id": "cat_5", "name": "Fuel", "type": "variable" },
    { "id": "cat_6", "name": "Transport", "type": "variable" },
    { "id": "cat_7", "name": "Others", "type": "fixed" }
];

const DEFAULT_STAGES = [
    { "name": "Land Preparation", "order": 1 },
    { "name": "Planting", "order": 2 },
    { "name": "Growing", "order": 3 },
    { "name": "Harvest", "order": 4 },
    { "name": "Milling", "order": 5 }
];
