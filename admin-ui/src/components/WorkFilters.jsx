import {
  Box,
  SimpleGrid,
  Input,
  Select,
  Button,
  FormControl,
  FormLabel,
  useColorModeValue,
  Collapse,
  IconButton,
  Flex
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useState } from 'react';

export const WorkFilters = ({ onFilter, onExport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
    minRoyalties: '',
    creator: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilter = () => {
    onFilter(filters);
  };

  const handleReset = () => {
    setFilters({
      category: '',
      startDate: '',
      endDate: '',
      minRoyalties: '',
      creator: ''
    });
    onFilter({});
  };

  const handleExport = () => {
    onExport(filters);
  };

  return (
    <Box
      bg={bgColor}
      p="4"
      rounded="lg"
      border="1px"
      borderColor={borderColor}
      mb="4"
    >
      <Flex justify="space-between" align="center" mb={isOpen ? "4" : "0"}>
        <Button
          variant="ghost"
          rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={() => setIsOpen(!isOpen)}
        >
          Filtres avancés
        </Button>
        <Button
          colorScheme="blue"
          variant="outline"
          onClick={handleExport}
        >
          Exporter
        </Button>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="4">
          <FormControl>
            <FormLabel>Catégorie</FormLabel>
            <Select
              name="category"
              value={filters.category}
              onChange={handleChange}
              placeholder="Toutes les catégories"
            >
              <option value="image">Images</option>
              <option value="video">Vidéos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
              <option value="other">Autres</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Date de début</FormLabel>
            <Input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Date de fin</FormLabel>
            <Input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Royalties minimales (MATIC)</FormLabel>
            <Input
              type="number"
              name="minRoyalties"
              value={filters.minRoyalties}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Créateur</FormLabel>
            <Input
              name="creator"
              value={filters.creator}
              onChange={handleChange}
              placeholder="Nom du créateur"
            />
          </FormControl>
        </SimpleGrid>

        <Flex mt="4" gap="2" justify="flex-end">
          <Button variant="ghost" onClick={handleReset}>
            Réinitialiser
          </Button>
          <Button colorScheme="blue" onClick={handleFilter}>
            Appliquer
          </Button>
        </Flex>
      </Collapse>
    </Box>
  );
};
