import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Reservation } from '../types';

export function useReservations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          car:cars (*)
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createReservation = async (reservation: Partial<Reservation>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert([reservation])
        .select();

      if (error) throw error;

      // Update car status if starting today
      const today = new Date().toISOString().split('T')[0];
      const resStart = new Date(reservation.start_date || '').toISOString().split('T')[0];
      
      if (reservation.car_id && resStart <= today) {
        await supabase
          .from('cars')
          .update({ status: 'Rented' })
          .eq('id', reservation.car_id);
      }

      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateReservation = async (id: string, updates: Partial<Reservation>, oldCarId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      // Sync Car Status if car changed
      if (oldCarId && updates.car_id && oldCarId !== updates.car_id) {
        await supabase.from('cars').update({ status: 'Available' }).eq('id', oldCarId);
        
        const today = new Date().toISOString().split('T')[0];
        const resStart = new Date(updates.start_date || '').toISOString().split('T')[0];
        if (resStart <= today) {
          await supabase.from('cars').update({ status: 'Rented' }).eq('id', updates.car_id);
        }
      } else if (updates.car_id) {
        // If same car, check if date moved
        const today = new Date().toISOString().split('T')[0];
        const resStart = new Date(updates.start_date || '').toISOString().split('T')[0];
        const status = resStart <= today ? 'Rented' : 'Available';
        await supabase.from('cars').update({ status }).eq('id', updates.car_id);
      }

      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteReservation = async (id: string, carId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (carId) {
        await supabase.from('cars').update({ status: 'Available' }).eq('id', carId);
      }

      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchReservations,
    createReservation,
    updateReservation,
    deleteReservation
  };
}
