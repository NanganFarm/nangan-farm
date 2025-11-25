import { supabase } from '../supabaseClient';

export const api = {
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
                    area: zone.area,
                    farm_id: zone.farmId,
                    user_id: zone.userId // We need to ensure this is passed
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
            userId: data.user_id
        };
    },

    async updateZone(id, updates) {
        // Map updates to snake_case
        const dbUpdates = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.area) dbUpdates.area = updates.area;

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
            userId: data.user_id
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
            .select('*')
            .eq('farm_id', farmId);

        if (error) throw error;
        return data.map(c => ({
            ...c,
            farmId: c.farm_id,
            zoneId: c.zone_id,
            userId: c.user_id,
            startDate: c.start_date,
            endDate: c.end_date,
            currentStageId: c.current_stage_id
        }));
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
            receipt_url: expense.receiptUrl
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

    // Categories
    async getCategories() {
        // For now, return static or fetch from DB if we implemented that table
        // Let's fetch from DB since we added the table
        const { data, error } = await supabase
            .from('categories')
            .select('*');

        if (error || !data || data.length === 0) {
            // Fallback to static if empty
            return [
                { "id": "cat_1", "name": "Labor", "type": "variable" },
                { "id": "cat_2", "name": "Fertilizer", "type": "variable" },
                { "id": "cat_3", "name": "Equipment", "type": "fixed" },
                { "id": "cat_4", "name": "Seeds", "type": "variable" },
                { "id": "cat_5", "name": "Fuel", "type": "variable" },
                { "id": "cat_6", "name": "Transport", "type": "variable" },
                { "id": "cat_7", "name": "Others", "type": "fixed" }
            ];
        }
        return data;
    },

    async addCategory(category) {
        const { data, error } = await supabase
            .from('categories')
            .insert([{ name: category.name, user_id: category.userId }]) // Assuming we pass userId
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteCategory(id) {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
