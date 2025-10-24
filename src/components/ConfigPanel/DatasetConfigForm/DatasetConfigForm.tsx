import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { updateDataset, deleteDataset } from '../../../features/datasets/datasetsSlice';
import { clearPendingComponent } from '../../../features/ui/uiSlice';
import type { KedroDataset, DatasetType } from '../../../types/kedro';
import { Button } from '../../UI/Button/Button';
import { Input } from '../../UI/Input/Input';
import { FilepathBuilder } from '../../UI/FilepathBuilder/FilepathBuilder';
import './DatasetConfigForm.scss';

interface DatasetFormData {
  name: string;
  type: DatasetType;
  filepath?: string;
  description?: string;
}

interface DatasetConfigFormProps {
  dataset: KedroDataset;
  onClose: () => void;
}

const DATASET_TYPES: { value: DatasetType; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'parquet', label: 'Parquet' },
  { value: 'json', label: 'JSON' },
  { value: 'excel', label: 'Excel' },
  { value: 'pickle', label: 'Pickle' },
  { value: 'memory', label: 'Memory (In-Memory)' },
  { value: 'sql', label: 'SQL' },
];

// Helper function to parse filepath into parts
const parseFilepath = (filepath: string): { baseLocation: string; dataLayer: string; fileName: string } => {
  if (!filepath || filepath.trim() === '') {
    return { baseLocation: 'data', dataLayer: '01_raw', fileName: '' };
  }

  const parts = filepath.split('/').filter(Boolean);

  if (parts.length >= 3) {
    return {
      baseLocation: parts[0],
      dataLayer: parts[1],
      fileName: parts.slice(2).join('/'),
    };
  } else if (parts.length === 2) {
    return {
      baseLocation: 'data',
      dataLayer: parts[0],
      fileName: parts[1],
    };
  } else if (parts.length === 1) {
    return {
      baseLocation: 'data',
      dataLayer: '01_raw',
      fileName: parts[0],
    };
  }

  return { baseLocation: 'data', dataLayer: '01_raw', fileName: '' };
};

export const DatasetConfigForm: React.FC<DatasetConfigFormProps> = ({ dataset, onClose }) => {
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<DatasetFormData>({
    defaultValues: {
      name: dataset.name || '',
      type: dataset.type || 'csv',
      filepath: dataset.filepath || '',
      description: dataset.description || '',
    },
  });

  const watchType = watch('type');

  // Parse initial filepath into parts
  const initialParts = parseFilepath(dataset.filepath || '');
  const [baseLocation, setBaseLocation] = useState(initialParts.baseLocation);
  const [dataLayer, setDataLayer] = useState(initialParts.dataLayer);
  const [fileName, setFileName] = useState(initialParts.fileName);

  // Update form filepath when parts change
  useEffect(() => {
    const base = baseLocation.trim() || 'data';
    const layer = dataLayer.trim();
    const file = fileName.trim();

    if (file) {
      const fullPath = `${base}/${layer}/${file}`;
      setValue('filepath', fullPath, { shouldDirty: true });
    } else {
      setValue('filepath', '', { shouldDirty: true });
    }
  }, [baseLocation, dataLayer, fileName, setValue]);

  const onSubmit = (data: DatasetFormData) => {
    dispatch(
      updateDataset({
        id: dataset.id,
        changes: {
          name: data.name.trim(),
          type: data.type,
          filepath: data.type !== 'memory' ? data.filepath?.trim() : undefined,
          description: data.description?.trim(),
        },
      })
    );

    // Don't clear pending here - ConfigPanel's handleClose will check if valid and clear it
    onClose();

    // Dispatch event to refresh validation if export wizard is open
    window.dispatchEvent(new CustomEvent('configUpdated'));
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete dataset "${dataset.name}"?`)) {
      dispatch(deleteDataset(dataset.id));
      dispatch(clearPendingComponent());
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="dataset-config-form">
      <div className="dataset-config-form__section">
        <Input
          label="Dataset Name"
          placeholder="e.g., raw_companies_data"
          error={errors.name?.message}
          helperText="Use snake_case naming (lowercase with underscores)"
          required
          {...register('name', {
            required: 'Dataset name is required',
            validate: (value) => {
              const trimmed = value.trim();
              if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
                return 'Must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
              }
              // Check for reserved Python keywords
              const reserved = ['for', 'if', 'else', 'while', 'def', 'class', 'return', 'import'];
              if (reserved.includes(trimmed)) {
                return `"${trimmed}" is a Python reserved keyword`;
              }
              return true;
            },
          })}
        />
      </div>

      <div className="dataset-config-form__section">
        <label className="dataset-config-form__label">
          Dataset Type <span className="dataset-config-form__required">*</span>
        </label>
        <select className="dataset-config-form__select" {...register('type', { required: true })}>
          {DATASET_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {watchType !== 'memory' && (
        <div className="dataset-config-form__section">
          <FilepathBuilder
            baseLocation={baseLocation}
            dataLayer={dataLayer}
            fileName={fileName}
            datasetType={watchType}
            onBaseLocationChange={setBaseLocation}
            onDataLayerChange={setDataLayer}
            onFileNameChange={setFileName}
          />
        </div>
      )}

      <div className="dataset-config-form__section">
        <label className="dataset-config-form__label">Description</label>
        <textarea
          className="dataset-config-form__textarea"
          rows={3}
          placeholder="Describe this dataset..."
          {...register('description')}
        />
      </div>

      <div className="dataset-config-form__actions">
        <Button type="button" variant="danger" onClick={handleDelete}>
          Delete
        </Button>
        <div className="dataset-config-form__actions-right">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
};
