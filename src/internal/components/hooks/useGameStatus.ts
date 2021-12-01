import { useEffect } from 'react';
import { fetchGameStatusAction } from '../../state/actions';
import { getGameName } from '../../state/selectors';
import { useAppDispatch, useAppSelector } from './reduxHooks';

export default function useGameStatus() {
  const { gameName, status } = useAppSelector(getGameName);

  // fetch data if not present
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchGameStatusAction());
    }
  }, [dispatch, status]);

  return { gameName, status };
}
