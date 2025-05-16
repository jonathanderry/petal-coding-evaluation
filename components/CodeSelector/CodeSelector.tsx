import { useState, useEffect } from "react";
import { ModiferChooser } from "../ModifierChooser/ModifierChooser";
import { calculateCodePrice } from "@/utilities/calculateCodePrice";
import { 
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

interface Modifier {
  id: number;
  amount: number;
  modifier_type: string;
  modifier_code: string;
  start_date: string;
  end_date: string | null;
}

interface Code {
  id: number;
  code: string;
  description: string;
  amount: number;
  start_date: string;
  end_date: string | null;
  modifiers: Modifier[];
}

interface CodeSelectorProps {
  onTotalPriceChange?: (totalPrice: number) => void;
}

interface CodeWithModifiers {
  code: Code;
  selectedModifiers: Modifier[];
  price: number;
}

const CodeSelector = ({ onTotalPriceChange }: CodeSelectorProps) => {
  const [availableCodes, setAvailableCodes] = useState<Code[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<CodeWithModifiers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCodeId, setSelectedCodeId] = useState<number | "">("");

  useEffect(() => {
    const fetchCodes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/code');
        if (!response.ok) {
          throw new Error("Failed to fetch codes");
        }
        const code = await response.json();
        setAvailableCodes([code]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCodes();
  }, []);

  // Calculate total price whenever selected codes change
  useEffect(() => {
    const totalPrice = selectedCodes.reduce((sum, item) => sum + item.price, 0);
    if (onTotalPriceChange) {
      onTotalPriceChange(totalPrice);
    }
  }, [selectedCodes, onTotalPriceChange]);

  const handleCodeChange = (event: any) => {
    setSelectedCodeId(event.target.value);
  };

  const addCode = () => {
    if (selectedCodeId === "") return;
    
    const codeToAdd = availableCodes.find(code => code.id === selectedCodeId);
    if (codeToAdd) {
      setSelectedCodes([
        ...selectedCodes,
        { 
          code: codeToAdd, 
          selectedModifiers: [], 
          price: codeToAdd.amount 
        }
      ]);
      setSelectedCodeId(""); // Reset selection after adding
    }
  };

  const removeCode = (index: number) => {
    const newSelectedCodes = [...selectedCodes];
    newSelectedCodes.splice(index, 1);
    setSelectedCodes(newSelectedCodes);
  };

  const handleModifierChange = (codeIndex: number, modifierIndex: number) => (modifier: Modifier) => {
    const newSelectedCodes = [...selectedCodes];
    const codeWithModifiers = { ...newSelectedCodes[codeIndex] };
    
    // Update the modifier at the specified index
    const newModifiers = [...codeWithModifiers.selectedModifiers];
    newModifiers[modifierIndex] = modifier;
    
    // Trim the array if we're setting modifier1 or modifier2
    if (modifierIndex === 0) {
      newModifiers.length = 1; // Keep only first modifier
    } else if (modifierIndex === 1) {
      newModifiers.length = 2; // Keep only first and second modifiers
    }
    
    codeWithModifiers.selectedModifiers = newModifiers;
    
    // Recalculate price
    codeWithModifiers.price = calculateCodePrice({
      code: codeWithModifiers.code,
      modifiers: newModifiers
    });
    
    newSelectedCodes[codeIndex] = codeWithModifiers;
    setSelectedCodes(newSelectedCodes);
  };

  if (isLoading) {
    return <div>Loading codes...</div>;
  }

  return (
    <div>
      <h2>Encounter Builder</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Add Code to Encounter</h3>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <FormControl fullWidth>
              <InputLabel id="code-select-label">Select Code</InputLabel>
              <Select
                labelId="code-select-label"
                id="code-select"
                value={selectedCodeId}
                label="Select Code"
                onChange={handleCodeChange}
              >
                {availableCodes.map((code) => (
                  <MenuItem key={code.id} value={code.id}>
                    {code.code} - {code.description} (${code.amount.toFixed(2)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <button 
            onClick={addCode}
            disabled={selectedCodeId === ""}
            style={{ 
              backgroundColor: selectedCodeId === "" ? '#ccc' : '#1976d2', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: selectedCodeId === "" ? 'not-allowed' : 'pointer',
              height: '40px'
            }}
          >
            Add to Encounter
          </button>
        </div>
      </div>
      
      <h3>Selected Codes:</h3>
      
      {selectedCodes.length === 0 ? (
        <p>No codes selected yet.</p>
      ) : (
        selectedCodes.map((item, codeIndex) => {
          // Filter out LMTS type modifiers
          const availableModifiers = item.code.modifiers.filter(
            (mod) => mod.modifier_type !== "LMTS"
          );
          
          return (
            <div 
              key={`${item.code.id}-${codeIndex}`} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '16px', 
                marginBottom: '16px' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4>{item.code.code} - {item.code.description}</h4>
                <button 
                  onClick={() => removeCode(codeIndex)}
                  style={{ 
                    backgroundColor: '#f44336', 
                    color: 'white', 
                    border: 'none', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <ModiferChooser 
                    modifiers={availableModifiers}
                    onChange={handleModifierChange(codeIndex, 0)}
                  >
                    Modifier 1
                  </ModiferChooser>
                </div>
                <div>
                  {item.selectedModifiers[0] && (
                    <ModiferChooser 
                      modifiers={availableModifiers}
                      onChange={handleModifierChange(codeIndex, 1)}
                    >
                      Modifier 2
                    </ModiferChooser>
                  )}
                </div>
                <div>
                  {item.selectedModifiers[1] && (
                    <ModiferChooser 
                      modifiers={availableModifiers}
                      onChange={handleModifierChange(codeIndex, 2)}
                    >
                      Modifier 3
                    </ModiferChooser>
                  )}
                </div>
              </div>
              
              <p style={{ textAlign: 'right' }}>
                Price: ${item.price.toFixed(2)}
              </p>
            </div>
          );
        })
      )}
      
      <h2 style={{ marginTop: '24px' }}>
        Total Price: ${selectedCodes.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
      </h2>
    </div>
  );
};

export default CodeSelector;
