import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Marina {
  id: number;
  name: string;
}

const marinaFormSchema = z.object({
  boatId: z.number(),
  marinaId: z.coerce.number({
    required_error: "Please select a marina",
  }),
  pier: z.string({
    required_error: "Please enter a pier designation",
  }).min(1, {
    message: "Pier designation is required",
  }),
  dock: z.coerce.number({
    required_error: "Please enter a dock number",
  }).min(1, {
    message: "Dock number must be at least 1",
  }),
});

type MarinaFormValues = z.infer<typeof marinaFormSchema>;

interface MarinaSelectionProps {
  boat: any;
  onSuccess: () => void;
}

export default function MarinaSelection({ boat, onSuccess }: MarinaSelectionProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAssignment, setExistingAssignment] = useState<any>(null);
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true);
  const [isLoadingMarinas, setIsLoadingMarinas] = useState(true);

  // Fetch existing dock assignment
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(`/api/dock-assignments/boat/${boat.id}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setExistingAssignment(data);
        } else if (response.status === 404) {
          setExistingAssignment(null);
        }
      } catch (error) {
        console.error("Error fetching dock assignment:", error);
      } finally {
        setIsLoadingAssignment(false);
      }
    };

    if (boat?.id) {
      fetchAssignment();
    }
  }, [boat?.id]);

  // Fetch marinas
  useEffect(() => {
    const fetchMarinas = async () => {
      try {
        const response = await fetch('/api/marinas', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setMarinas(data);
        }
      } catch (error) {
        console.error("Error fetching marinas:", error);
      } finally {
        setIsLoadingMarinas(false);
      }
    };

    fetchMarinas();
  }, []);

  const defaultValues: Partial<MarinaFormValues> = {
    boatId: boat.id,
    marinaId: existingAssignment?.marinaId || undefined,
    pier: existingAssignment?.pier || undefined,
    dock: existingAssignment?.dock || undefined,
  };

  const form = useForm<MarinaFormValues>({
    resolver: zodResolver(marinaFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (existingAssignment) {
      form.reset({
        boatId: boat.id,
        marinaId: existingAssignment.marinaId,
        pier: existingAssignment.pier,
        dock: existingAssignment.dock,
      });
    }
  }, [existingAssignment, boat.id, form]);

  async function onSubmit(values: MarinaFormValues) {
    setIsSubmitting(true);
    try {
      const method = existingAssignment ? 'PUT' : 'POST';
      const url = existingAssignment 
        ? `/api/dock-assignments/${existingAssignment.id}`
        : '/api/dock-assignments';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save marina assignment');
      }

      toast({
        title: "Success",
        description: `Marina assignment ${existingAssignment ? 'updated' : 'created'} successfully`,
        variant: "default",
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save marina assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingAssignment || isLoadingMarinas) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="marinaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marina</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a marina" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {marinas.map((marina) => (
                    <SelectItem key={marina.id} value={marina.id.toString()}>
                      {marina.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pier</FormLabel>
              <FormControl>
                <Input placeholder="e.g., A, B, North" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dock Number</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 15" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Saving...' : existingAssignment ? 'Update Assignment' : 'Assign Marina'}
        </Button>
      </form>
    </Form>
  );
}