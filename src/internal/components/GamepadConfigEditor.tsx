import { DefaultButton, PrimaryButton } from '@fluentui/react';
import React, { FormEventHandler, memo, useCallback, useEffect, useState } from 'react';
import { DEFAULT_CONFIG_NAME, emptyGamepadConfig } from '../../shared/gamepadConfig';
import { GamepadConfig, KeyMap, StickNum } from '../../shared/types';
import { getGamepadConfig, isConfigActive } from '../state/selectors';
import { confirm } from '../utils/confirmUtil';
import { useAppSelector } from './hooks/reduxHooks';
import SensitivitySelector from './SensitivitySelector';
import StickSelector from './StickSelector';
import useKeyConfigEditorState from './hooks/useKeyConfigEditorState';
import { exportConfig } from '../utils/importExport';
import KeybindingsTable from './KeybindingsTable';

interface SensitivityEditorProps {
  name: string;
  onCancelCreate: () => void;
  onDelete: (name: string) => void;
  onSubmitChanges: (name: string, gamepadConfig: GamepadConfig) => void | Promise<any>;
  onActivate: (name: string) => void | Promise<any>;
}

function GamepadConfigEditor({ name, onSubmitChanges, onCancelCreate, onActivate, onDelete }: SensitivityEditorProps) {
  const { status, config: storedGamepadConfig } = useAppSelector((state) => getGamepadConfig(state, name));
  const isActive = useAppSelector((state) => isConfigActive(state, name));
  const isSubmitting = status === 'writing';
  const isNewDraft = !storedGamepadConfig;
  const isDefaultConfig = name === DEFAULT_CONFIG_NAME;
  const initialGamepadConfig = storedGamepadConfig || emptyGamepadConfig;
  const [state, dispatch] = useKeyConfigEditorState(initialGamepadConfig);
  const noMouse = state.config.mouseConfig.mouseControls === undefined;
  const hasChanges = isNewDraft || state.changes.keyConfig || state.changes.mouseConfig;
  // Starts in read-only state, but have button to enable editing/save changes?
  const [isEditing, setIsEditing] = useState(isNewDraft);
  useEffect(() => {
    if (isNewDraft) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
    dispatch({ type: 'reset', config: initialGamepadConfig });
  }, [dispatch, name, isNewDraft, initialGamepadConfig]);

  const handleKeybindChange = useCallback(
    (button: string, updated: KeyMap) => {
      dispatch({
        type: 'updateKeyConfig',
        button,
        keyMap: updated,
      });
    },
    [dispatch],
  );

  const handleMouseControlsChange = useCallback(
    (mouseControls?: StickNum) => {
      dispatch({
        type: 'updateMouseControls',
        mouseControls,
      });
    },
    [dispatch],
  );

  const handleActivate = useCallback(() => {
    onActivate(name);
  }, [name, onActivate]);

  const handleToggleEditing = useCallback(() => {
    if (isNewDraft && isEditing) {
      if (confirm('Are you sure you want to cancel creating a new preset?')) {
        onCancelCreate();
      }
      return;
    }
    if (isEditing && (!hasChanges || confirm('Are you sure you want to cancel? You will lose any changes.'))) {
      // Reset
      dispatch({ type: 'reset', config: storedGamepadConfig });
      setIsEditing(!isEditing);
    } else if (!isEditing) {
      setIsEditing(!isEditing);
    }
  }, [dispatch, hasChanges, isEditing, isNewDraft, onCancelCreate, storedGamepadConfig]);

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this preset?')) {
      onDelete(name);
    }
  }, [name, onDelete]);

  const handleExport = useCallback(() => {
    exportConfig(state.config, name);
  }, [state.config, name]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      if (!state.errors.hasErrors) {
        onSubmitChanges(name, state.config);
      } else {
        console.error('Cannot submit', state.errors);
      }
    },
    [name, onSubmitChanges, state.config, state.errors],
  );

  return (
    <form className="vertical full-height" onSubmit={handleSubmit}>
      <section className="config-editor full-absolute vertical">
        <KeybindingsTable
          className="margin-vertical"
          gamepadConfig={state.config}
          errors={state.errors}
          isEditing={isEditing}
          onKeybindChange={handleKeybindChange}
        />
        <div className="margin-bottom">
          <div className="horizontal">
            <StickSelector
              readOnly={!isEditing}
              onChange={handleMouseControlsChange}
              stick={state.config.mouseConfig.mouseControls}
            />
          </div>
          <SensitivitySelector
            dispatch={dispatch}
            disabled={noMouse}
            readOnly={!isEditing}
            sensitivity={state.config.mouseConfig.sensitivity}
          />
        </div>
      </section>
      <section className="horizontal space-between padding-top-s">
        <div className="margin-right-s">
          <DefaultButton onClick={handleToggleEditing}>{isEditing ? 'Cancel' : 'Edit'}</DefaultButton>
          {!isEditing ? (
            <DefaultButton className="margin-left-s" disabled={isDefaultConfig} onClick={handleDelete}>
              Delete
            </DefaultButton>
          ) : null}
          {!isEditing ? (
            <DefaultButton className="margin-left-s" onClick={handleExport}>
              Export
            </DefaultButton>
          ) : null}
        </div>
        {isEditing ? (
          <PrimaryButton type="submit" disabled={state.errors.hasErrors || !hasChanges || isSubmitting}>
            {isNewDraft ? 'Create' : 'Save'}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={handleActivate} disabled={state.errors.hasErrors || isActive || isSubmitting}>
            Use
          </PrimaryButton>
        )}
      </section>
    </form>
  );
}

export default memo(GamepadConfigEditor);
