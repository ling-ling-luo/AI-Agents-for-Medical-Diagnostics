import { useParams } from 'react-router-dom';
import { CreateCaseForm } from './CreateCaseForm';

export const EditCaseWrapper = () => {
  const { caseId } = useParams<{ caseId: string }>();

  return (
    <CreateCaseForm
      editMode={true}
      caseId={caseId ? parseInt(caseId) : undefined}
    />
  );
};
