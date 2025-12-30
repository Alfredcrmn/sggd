import { useParams } from "react-router-dom";

const ProcessDetail = () => {
  const { id } = useParams();
  return (
    <div>
      <h2>Detalle del Proceso</h2>
      <p>Estás viendo el folio: <strong>{id}</strong></p>
    </div>
  );
};
export default ProcessDetail;