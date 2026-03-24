import { useParams, useNavigate } from 'react-router-dom';
import { TournamentApplicationTemplate } from "@/components/ui/TournamentApplicationTemplate/TournamentApplicationTemplate";

export default function TournamentEditPage() {
    const params = useParams();
    const id = params.id as string;

    return <TournamentApplicationTemplate id={id} isEdit={true} />;
}
