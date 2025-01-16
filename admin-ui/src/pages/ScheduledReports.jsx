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
  Switch,
  VStack,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import cronstrue from 'cronstrue';

export const ScheduledReports = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedReport, setSelectedReport] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    schedule: '',
    filters: {},
    recipients: '',
    is_active: true
  });

  
  const { data: reports, isLoading } = useQuery(
    ['scheduled-reports'],
    () => adminApi.getScheduledReports(),
    {
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les rapports programmés',
          status: 'error'
        });
      }
    }
  );


  const mutation = useMutation(
    (data) => {
      if (selectedReport) {
        return adminApi.updateScheduledReport(selectedReport.id, data);
      }
      return adminApi.createScheduledReport(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scheduled-reports']);
        toast({
          title: 'Succès',
          description: `Rapport ${selectedReport ? 'modifié' : 'créé'} avec succès`,
          status: 'success'
        });
        handleClose();
      },
      onError: () => {
        toast({
          title: 'Erreur',
          description: `Impossible de ${selectedReport ? 'modifier' : 'créer'} le rapport`,
          status: 'error'
        });
      }
    }
  );


  const deleteMutation = useMutation(
    (id) => adminApi.deleteScheduledReport(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scheduled-reports']);
        toast({
          title: 'Succès',
          description: 'Rapport supprimé avec succès',
          status: 'success'
        });
      },
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le rapport',
          status: 'error'
        });
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      recipients: formData.recipients.split(',').map(email => email.trim()),
      filters: typeof formData.filters === 'string' 
        ? JSON.parse(formData.filters)
        : formData.filters
    };
    mutation.mutate(data);
  };

  const handleEdit = (report) => {
    setSelectedReport(report);
    setFormData({
      ...report,
      recipients: report.recipients.join(', '),
      filters: JSON.stringify(report.filters, null, 2)
    });
    onOpen();
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleClose = () => {
    setSelectedReport(null);
    setFormData({
      name: '',
      description: '',
      type: '',
      schedule: '',
      filters: {},
      recipients: '',
      is_active: true
    });
    onClose();
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
      key: 'schedule',
      label: 'Fréquence',
      render: (value) => (
        <Text>{cronstrue.toString(value, { locale: 'fr' })}</Text>
      )
    },
    {
      key: 'next_run_at',
      label: 'Prochaine exécution',
      render: (value) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (value) => (
        <Badge colorScheme={value ? 'green' : 'gray'}>
          {value ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, report) => (
        <HStack spacing="2">
          <IconButton
            icon={<EditIcon />}
            size="sm"
            onClick={() => handleEdit(report)}
            aria-label="Modifier"
          />
          <IconButton
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            onClick={() => handleDelete(report.id)}
            aria-label="Supprimer"
          />
        </HStack>
      )
    }
  ];

  return (
    <Box>
      <Box mb="6" display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="lg">Rapports programmés</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={onOpen}
        >
          Nouveau rapport
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={reports?.data ?? []}
        isLoading={isLoading}
      />

      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>
            {selectedReport ? 'Modifier le rapport' : 'Nouveau rapport'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing="4">
              <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Rapport mensuel des œuvres"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du rapport..."
                />
              </FormControl>

              <SimpleGrid columns={2} spacing="4" w="100%">
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
                  <FormLabel>Planning (Cron)</FormLabel>
                  <Input
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="0 0 * * *"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Destinataires (emails séparés par des virgules)</FormLabel>
                <Input
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  placeholder="user@example.com, admin@example.com"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Filtres (JSON)</FormLabel>
                <Textarea
                  value={
                    typeof formData.filters === 'string'
                      ? formData.filters
                      : JSON.stringify(formData.filters, null, 2)
                  }
                  onChange={(e) => setFormData({ ...formData, filters: e.target.value })}
                  placeholder="{}"
                  fontFamily="mono"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Actif</FormLabel>
                <Switch
                  isChecked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Annuler
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={mutation.isLoading}
            >
              {selectedReport ? 'Modifier' : 'Créer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
