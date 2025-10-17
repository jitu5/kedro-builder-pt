import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../../store/hooks';
import { updateNode, deleteNode } from '../../../features/nodes/nodesSlice';
import { KedroNode } from '../../../types/kedro';
import { Button } from '../../UI/Button/Button';
import { Input } from '../../UI/Input/Input';
import './NodeConfigForm.scss';

interface NodeFormData {
  name: string;
  description: string;
  functionCode?: string;
}

interface NodeConfigFormProps {
  node: KedroNode;
  onClose: () => void;
}

export const NodeConfigForm: React.FC<NodeConfigFormProps> = ({ node, onClose }) => {
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NodeFormData>({
    defaultValues: {
      name: node.name || '',
      description: node.description || '',
      functionCode: node.functionCode || '',
    },
  });

  const onSubmit = (data: NodeFormData) => {
    dispatch(
      updateNode({
        id: node.id,
        changes: {
          name: data.name.trim(),
          description: data.description.trim(),
          functionCode: data.functionCode?.trim() || undefined,
        },
      })
    );
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${node.name || 'this node'}"?`)) {
      dispatch(deleteNode(node.id));
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="node-config-form">
      <div className="node-config-form__section">
        <Input
          label="Node Name"
          placeholder="e.g., Load Raw Data"
          error={errors.name?.message}
          required
          {...register('name', {
            required: 'Node name is required',
            validate: (value) => {
              const trimmed = value.trim();
              if (trimmed.length === 0) return 'Node name cannot be empty';
              if (!/^[a-zA-Z][a-zA-Z0-9_\s]*$/.test(trimmed)) {
                return 'Must start with a letter and contain only letters, numbers, spaces, and underscores';
              }
              return true;
            },
          })}
        />
      </div>

      <div className="node-config-form__section">
        <label className="node-config-form__label">Description</label>
        <textarea
          className="node-config-form__textarea"
          rows={3}
          placeholder="Describe what this node does..."
          {...register('description')}
        />
      </div>

      <div className="node-config-form__section">
        <label className="node-config-form__label">
          Function Code <span className="node-config-form__optional">(optional)</span>
        </label>
        <textarea
          className="node-config-form__textarea node-config-form__textarea--code"
          rows={10}
          placeholder="# Python code for this node function...&#10;# def my_function(input_data):&#10;#     return processed_data"
          {...register('functionCode')}
        />
        <span className="node-config-form__helper">
          Add custom Python code for this node (optional)
        </span>
      </div>

      <div className="node-config-form__actions">
        <Button type="button" variant="danger" onClick={handleDelete}>
          Delete
        </Button>
        <div className="node-config-form__actions-right">
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
