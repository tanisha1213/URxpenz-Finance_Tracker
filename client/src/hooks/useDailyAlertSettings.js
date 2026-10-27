import { useState, useEffect } from 'react';
import API from '../services/api';

/**
 * Custom hook to manage customizable daily budget alert time
 * @param {string} initialTime - e.g. '20:00'
 * @param {boolean} isPro - User pro tier flag
 * @param {Function} onUpgradeNeeded - Callback when non-pro user tries to change alert time
 */
export function useDailyAlertSettings(initialTime = '20:00', isPro = false, onUpgradeNeeded = null) {
  const [dailyAlertTime, setDailyAlertTime] = useState(initialTime);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (initialTime) {
      setDailyAlertTime(initialTime);
    }
  }, [initialTime]);

  const saveAlertTime = async (customTime = null) => {
    const timeToSave = customTime || dailyAlertTime;

    if (!isPro) {
      if (typeof onUpgradeNeeded === 'function') {
        onUpgradeNeeded('daily_budget');
      }
      return { success: false, message: 'Pro subscription required for custom alert times.' };
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeToSave)) {
      setIsError(true);
      setStatusMessage('Please select a valid time (HH:mm)');
      setTimeout(() => setStatusMessage(''), 4000);
      return { success: false, message: 'Invalid time format' };
    }

    try {
      setSaving(true);
      setIsError(false);
      setStatusMessage('');

      const res = await API.patch('/budget/alert-time', { dailyAlertTime: timeToSave });
      const msg = res.data?.message || `Daily alert time saved (${timeToSave})`;
      setStatusMessage(msg);
      setTimeout(() => setStatusMessage(''), 4000);
      return { success: true, message: msg };
    } catch (err) {
      setIsError(true);
      const errMsg = err.response?.data?.message || 'Failed to save alert time';
      setStatusMessage(errMsg);
      setTimeout(() => setStatusMessage(''), 4000);
      return { success: false, message: errMsg };
    } finally {
      setSaving(false);
    }
  };

  return {
    dailyAlertTime,
    setDailyAlertTime,
    saveAlertTime,
    saving,
    statusMessage,
    isError
  };
}

export default useDailyAlertSettings;
