import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isValidCategory, pickerGroupsFor, type TransactionType } from "@/lib/categorization";

export function CategoryPicker({ type, value, onChange, historical }: {
  type: TransactionType;
  value: string;
  onChange: (category: string) => void;
  historical?: string;
}) {
  return (
    <Select value={value} onValueChange={(category) => {
      if (isValidCategory(category, type, historical !== undefined)) onChange(category);
    }}>
      <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-80">
        {pickerGroupsFor(type, historical).map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel className="text-xs text-muted-foreground">{group.label}</SelectLabel>
            {group.categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}