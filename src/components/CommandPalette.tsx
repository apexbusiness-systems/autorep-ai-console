import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Headphones,
  MessageSquare,
  Users,
  Car,
  FileText,
  Shield,
  Settings,
} from "lucide-react";
import { useLeads, useVehicles } from "@/hooks/use-store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const leads = useLeads();
  const vehicles = useVehicles();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
            <Headphones className="mr-2 h-4 w-4" />
            <span>Live Agent</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/conversations"))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Conversations</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/leads"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Leads</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/vehicles"))}>
            <Car className="mr-2 h-4 w-4" />
            <span>Vehicles & Quotes</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/finance"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Finance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/manager"))}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Manager</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/integrations"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Integrations</span>
          </CommandItem>
        </CommandGroup>

        {leads.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Leads">
              {leads.slice(0, 5).map((lead) => (
                <CommandItem
                  key={lead.id}
                  onSelect={() => runCommand(() => navigate("/leads"))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>{lead.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {vehicles.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Vehicles">
              {vehicles.slice(0, 5).map((vehicle) => (
                <CommandItem
                  key={vehicle.id}
                  onSelect={() => runCommand(() => navigate("/vehicles"))}
                >
                  <Car className="mr-2 h-4 w-4" />
                  <span>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
