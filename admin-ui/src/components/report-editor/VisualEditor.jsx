import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { SectionEditor } from './SectionEditor';
import { FilterEditor } from './FilterEditor';

export const VisualEditor = ({ initialData, onChange, onPreview }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    config: {
      sections: [],
      filters: {}
    }
  });

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleBasicInfoChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      onChange(newData);
      return newData;
    });
  };

  const handleSectionsChange = (sections) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        config: {
          ...prev.config,
          sections
        }
      };
      onChange(newData);
      return newData;
    });
  };

  const handleFiltersChange = (filters) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        config: {
          ...prev.config,
          filters
        }
      };
      onChange(newData);
      return newData;
    });
  };

  const handlePreview = () => {
    // Validation basique
    if (!formData.name || !formData.type || formData.config.sections.length === 0) {
      toast({
        title: 'Validation',
        description: 'Veuillez remplir tous les champs requis et ajouter au moins une section',
        status: 'warning'
      });
      return;
    }

    onPreview(formData);
  };

  return (
    <Box bg={bgColor} p="6" borderRadius="lg">
      <Tabs>
        <TabList>
          <Tab>Informations de base</Tab>
          <Tab>Sections</Tab>
          <Tab>Filtres</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing="6" align="stretch">
              <FormControl isRequired>
                <FormLabel>Nom du modèle</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  placeholder="Rapport mensuel des œuvres"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  placeholder="Description détaillée du modèle..."
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleBasicInfoChange('type', e.target.value)}
                >
                  <option value="">Sélectionner un type</option>
                  <option value="works">Œuvres</option>
                  <option value="royalties">Royalties</option>
                  <option value="analytics">Analyses</option>
                </Select>
              </FormControl>
            </VStack>
          </TabPanel>

          <TabPanel>
            <SectionEditor
              sections={formData.config.sections}
              onChange={handleSectionsChange}
              formData={formData}
            />
          </TabPanel>

          <TabPanel>
            <FilterEditor
              filters={formData.config.filters}
              onChange={handleFiltersChange}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Box mt="6" textAlign="right">
        <Button
          colorScheme="blue"
          onClick={handlePreview}
        >
          Prévisualiser
        </Button>
      </Box>
    </Box>
  );
};
