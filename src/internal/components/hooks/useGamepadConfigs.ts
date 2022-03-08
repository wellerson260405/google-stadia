import { useEffect } from 'react';
import { fetchAllAction } from '../../state/actions';
import { getActiveConfigName, getAllGamepadConfigs, getIsEnabled } from '../../state/selectors';
import { useAppDispatch, useAppSelector } from './reduxHooks';

export default function useGamepadConfigs() {
  const { configs, status, error } = useAppSelector(getAllGamepadConfigs);
  const activeConfig = useAppSelector(getActiveConfigName);
  const isEnabled = useAppSelector(getIsEnabled);

  // fetch data if not present
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAllAction());
    }
  }, [dispatch, status]);

  return { activeConfig, configs, isEnabled, status, error };
}
