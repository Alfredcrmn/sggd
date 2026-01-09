import { useSearchParams, useParams } from "react-router-dom";
import WarrantyDetail from "./WarrantyDetail";
import ReturnDetail from "./ReturnDetail";

const ProcessDetail = () => {
  const { id } = useParams(); 
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type"); 

  if (type === 'garantia') {
    return <WarrantyDetail id={id} />;
  }

  if (type === 'devolucion') {
    return <ReturnDetail id={id} />;
  }

  return (
    <div className="p-10 text-center text-gray-500">
      <p>⚠️ Error: No se especificó el tipo de proceso.</p>
    </div>
  );
};

export default ProcessDetail;