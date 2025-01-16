import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  SimpleGrid,
  IconButton,
  Button,
  useColorModeValue,
  Text,
  HStack
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState } from 'react';

const FILTER_TYPES = [
  { value: 'period', label: 'Période' },
  { value: 'category', label: 'Catégorie' },
  { value: 'minAmount', label: 'Montant minimum' },
  { value: 'status', label: 'Statut' },
  { value: 'creator', label: 'Créateur' }
];

const PERIOD_OPTIONS = [
  { value: '1d', label: 'Dernier jour' },
  { value: '7d', label: 'Dernière semaine' },
  { value: '1M', label: 'Dernier mois' },
  { value: '3M', label: 'Dernier trimestre' },
  { value: '1Y', label: 'Dernière année' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'pending', label: 'En attente' }
];

const CATEGORY_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Vidéo' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Autre' }
];

export const FilterEditor = ({ filters, onChange }) => {
  const [availableFilters] = useState(FILTER_TYPES);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleAddFilter = (type) => {
    const defaultValue = type === 'period' ? '1M' :
                        type === 'minAmount' ? 0 :
                        '';
    onChange({
      ...filters,
      [type]: defaultValue
    });
  };

  const handleRemoveFilter = (type) => {
    const newFilters = { ...filters };
    delete newFilters[type];
    onChange(newFilters);
  };

  const handleFilterChange = (type, value) => {
    onChange({
      ...filters,
      [type]: value
    });
  };

  const renderFilterInput = (type, value) => {
    switch (type) {
      case 'period':
        return (
          <Select
            value={value}
            onChange={(e) => handleFilterChange(type, e.target.value)}
          >
            {PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );

      case 'category':
        return (
          <Select
            value={value}
            onChange={(e) => handleFilterChange(type, e.target.value)}
          >
            {CATEGORY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );

      case 'minAmount':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(type, parseFloat(e.target.value))}
            min="0"
            step="0.01"
          />
        );

      case 'status':
        return (
          <Select
            value={value}
            onChange={(e) => handleFilterChange(type, e.target.value)}
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );

      case 'creator':
        return (
          <Input
            value={value}
            onChange={(e) => handleFilterChange(type, e.target.value)}
            placeholder="Nom du créateur"
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <VStack spacing="4" align="stretch">
        {Object.entries(filters).map(([type, value]) => (
          <Box
            key={type}
            p="4"
            bg={bgColor}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
          >
            <HStack justify="space-between" mb="2">
              <Text fontWeight="medium">
                {FILTER_TYPES.find(f => f.value === type)?.label}
              </Text>
              <IconButton
                size="sm"
                icon={<DeleteIcon />}
                onClick={() => handleRemoveFilter(type)}
                colorScheme="red"
                aria-label="Remove filter"
              />
            </HStack>
            <FormControl>
              {renderFilterInput(type, value)}
            </FormControl>
          </Box>
        ))}

        {Object.keys(filters).length < FILTER_TYPES.length && (
          <Box mt="4">
            <Text mb="2" fontWeight="medium">Ajouter un filtre</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
              {FILTER_TYPES.filter(type => !filters[type.value]).map(type => (
                <Button
                  key={type.value}
                  leftIcon={<AddIcon />}
                  variant="outline"
                  onClick={() => handleAddFilter(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
