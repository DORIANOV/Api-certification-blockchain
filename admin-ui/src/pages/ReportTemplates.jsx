import { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  useDisclosure,
  SimpleGrid,
  Text,
  Badge,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Flex,
  Divider
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Chart } from '../components/Chart';

const PreviewSection = ({ section }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  switch (section.type) {
    case 'summary':
      return (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
          {Object.entries(section.data).map(([key, value]) => (
            <Box
              key={key}
              p="4"
              bg={bgColor}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
            >
              <Text fontSize="sm" color="gray.500">
                {key.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      );

    case 'chart':
      return (
        <Box
          p="4"
          bg={bgColor}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
        >
          <Text mb="4" fontWeight="medium">{section.title}</Text>
          <Chart
            type={section.chartType}
            data={section.data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              height: 300
            }}
          />
        </Box>
      );

    case 'table':
      return (
        <Box
          p="4"
          bg={bgColor}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
        >
          <Text mb="4" fontWeight="medium">{section.title}</Text>
          <DataTable
            columns={section.columns.map(col => ({
              key: col,
              label: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')
            }))}
            data={section.data}
          />
        </Box>
      );

    default:
      return null;
  }
};

export const ReportTemplates = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen: isEditorOpen, onOpen: onEditorOpen, onClose: onEditorClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    config: ''
  });

 
  const { data: templates, isLoading } = useQuery(
    ['report-templates'],
    () => adminApi.getReportTemplates(),
    {
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les modèles',
          status: 'error'
        });
      }
    }
  );

  const mutation = useMutation(
    (data) => {
      if (selectedTemplate) {
        return adminApi.updateReportTemplate(selectedTemplate.id, data);
      }
      return adminApi.createReportTemplate(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['report-templates']);
        toast({
          title: 'Succès',
          description: `Modèle ${selectedTemplate ? 'modifié' : 'créé'} avec succès`,
          status: 'success'
        });
        handleEditorClose();
      },
      onError: () => {
        toast({
          title: 'Erreur',
          description: `Impossible de ${selectedTemplate ? 'modifier' : 'créer'} le modèle`,
          status: 'error'
        });
      }
    }
  );

 
  const deleteMutation = useMutation(
    (id) => adminApi.deleteReportTemplate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['report-templates']);
        toast({
          title: 'Succès',
          description: 'Modèle supprimé avec succès',
          status: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le modèle',
          status: 'error'
        });
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      config: typeof formData.config === 'string'
        ? JSON.parse(formData.config)
        : formData.config
    };
    mutation.mutate(data);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      ...template,
      config: JSON.stringify(template.config, null, 2)
    });
    onEditorOpen();
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePreview = async (template) => {
    try {
      const data = await adminApi.previewReportTemplate(template.id);
      setPreviewData(data);
      onPreviewOpen();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer la prévisualisation',
        status: 'error'
      });
    }
  };

  const handleEditorClose = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      type: '',
      config: ''
    });
    onEditorClose();
  };

  const columns = [
    { key: 'name', label: 'Nom' },
    { 
      key: 'type',
      label: 'Type',
      render: (value) => (
        <Badge
          colorScheme={
            value === 'works' ? 'blue' :
            value === 'royalties' ? 'green' :
            'purple'
          }
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'is_system',
      label: 'Type',
      render: (value) => (
        <Badge colorScheme={value ? 'purple' : 'gray'}>
          {value ? 'Système' : 'Personnalisé'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, template) => (
        <HStack spacing="2">
          <IconButton
            icon={<ViewIcon />}
            size="sm"
            onClick={() => handlePreview(template)}
            aria-label="Prévisualiser"
          />
          {!template.is_system && (
            <>
              <IconButton
                icon={<EditIcon />}
                size="sm"
                onClick={() => handleEdit(template)}
                aria-label="Modifier"
              />
              <IconButton
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                onClick={() => handleDelete(template.id)}
                aria-label="Supprimer"
              />
            </>
          )}
        </HStack>
      )
    }
  ];

  return (
    <Box>
      <Box mb="6" display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="lg">Modèles de rapports</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={onEditorOpen}
        >
          Nouveau modèle
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={templates?.data ?? []}
        isLoading={isLoading}
      />

      {}
      <Modal isOpen={isEditorOpen} onClose={handleEditorClose} size="xl">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>
            {selectedTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing="4">
              <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Rapport mensuel"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du modèle..."
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="">Sélectionner un type</option>
                  <option value="works">Œuvres</option>
                  <option value="royalties">Royalties</option>
                  <option value="analytics">Analyses</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Configuration (JSON)</FormLabel>
                <Textarea
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  placeholder="{}"
                  minH="200px"
                  fontFamily="mono"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleEditorClose}>
              Annuler
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={mutation.isLoading}
            >
              {selectedTemplate ? 'Modifier' : 'Créer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Prévisualisation du rapport
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {previewData && (
              <VStack spacing="6" align="stretch">
                <Box>
                  <Heading size="md" mb="2">{previewData.name}</Heading>
                  <Text color="gray.500">{previewData.description}</Text>
                </Box>

                <Divider />

                {previewData.sections.map((section, index) => (
                  <Box key={index}>
                    <PreviewSection section={section} />
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button onClick={onPreviewClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
