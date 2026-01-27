import { MobileSidebar } from "./Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
    return (
        <div className="flex items-center p-4 border-b h-16 bg-white dark:bg-slate-950">
            <MobileSidebar />
            <div className="flex w-full justify-end">
                <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
            </div>
        </div>
    );
}
