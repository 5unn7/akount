import { Badge } from '../ui/badge';

interface AccountStatusBadgeProps {
    status: 'active' | 'inactive';
}

export function AccountStatusBadge({ status }: AccountStatusBadgeProps) {
    if (status === 'active') {
        return (
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                Active
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-zinc-500/15 text-zinc-400 border-zinc-500/20">
            Inactive
        </Badge>
    );
}
