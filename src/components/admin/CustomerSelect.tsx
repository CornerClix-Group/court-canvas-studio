import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Mail, MapPin, Phone } from "lucide-react";

interface Customer {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface CustomerSelectProps {
  value: string | null;
  onChange: (customerId: string | null, customer: Customer | null) => void;
  disabled?: boolean;
}

export function CustomerSelect({ value, onChange, disabled = false }: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("contact_name");

      if (!error && data) {
        setCustomers(data);
        
        // Set initially selected customer
        if (value) {
          const customer = data.find((c) => c.id === value);
          setSelectedCustomer(customer || null);
        }
      }
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (value && customers.length > 0) {
      const customer = customers.find((c) => c.id === value);
      setSelectedCustomer(customer || null);
    } else if (!value) {
      setSelectedCustomer(null);
    }
  }, [value, customers]);

  const handleChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);
    onChange(customerId, customer || null);
  };

  const formatAddress = (customer: Customer) => {
    const parts = [
      customer.address,
      customer.city,
      customer.state,
      customer.zip,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div className="space-y-3">
      <Select
        value={value || ""}
        onValueChange={handleChange}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading customers..." : "Select a customer"} />
        </SelectTrigger>
        <SelectContent>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{customer.contact_name}</span>
                {customer.company_name && (
                  <span className="text-muted-foreground">
                    — {customer.company_name}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCustomer && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">{selectedCustomer.contact_name}</div>
                {selectedCustomer.company_name && (
                  <div className="text-muted-foreground">
                    {selectedCustomer.company_name}
                  </div>
                )}
              </div>
            </div>
            {selectedCustomer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{selectedCustomer.email}</span>
              </div>
            )}
            {selectedCustomer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{selectedCustomer.phone}</span>
              </div>
            )}
            {formatAddress(selectedCustomer) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>{formatAddress(selectedCustomer)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
