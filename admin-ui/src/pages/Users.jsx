import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Heading,
  Button,
  useToast,
  Badge,
  Switch,
  Flex,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react';
import { DataTable } from '../components/DataTable';
import { adminApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const Users = () => {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useQuery(
    ['admin', 'users', { page, limit, search: searchTerm }],
    () =>
      adminApi
        .getUsers({ page, limit, search: searchTerm })
        .then((res) => res.data.data),
    {
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les utilisateurs',
          status: 'error'
        });
      }
    }
  );

  const toggleAdminMutation = useMutation(
    (userId) => adminApi.toggleUserAdmin(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin', 'users']);
        toast({
          title: 'Succès',
          description: 'Droits administrateur mis à jour',
          status: 'success'
        });
        onClose();
      },
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier les droits',
          status: 'error'
        });
      }
    }
  );

  const handleToggleAdmin = (user) => {
    if (user.id === currentUser.id) {
      toast({
        title: 'Action non autorisée',
        description: 'Vous ne pouvez pas modifier vos propres droits',
        status: 'error'
      });
      return;
    }
    setSelectedUser(user);
    onOpen();
  };

  const confirmToggleAdmin = () => {
    if (selectedUser) {
      toggleAdminMutation.mutate(selectedUser.id);
    }
  };

  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'company', label: 'Entreprise' },
    {
      key: 'created_at',
      label: 'Date d\'inscription',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'is_admin',
      label: 'Admin',
      render: (value, user) => (
        <Switch
          isChecked={value}
          onChange={() => handleToggleAdmin(user)}
          isDisabled={user.id === currentUser.id}
        />
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (_, user) => (
        <Badge
          colorScheme={user.is_admin ? 'purple' : 'gray'}
          variant="subtle"
          px="2"
        >
          {user.is_admin ? 'Administrateur' : 'Utilisateur'}
        </Badge>
      )
    }
  ];

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="8">
        <Heading size="lg">Gestion des utilisateurs</Heading>
      </Flex>

      <DataTable
        columns={columns}
        data={data?.users ?? []}
        isLoading={isLoading}
        pagination={data?.pagination ?? {}}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearch={setSearchTerm}
        searchPlaceholder="Rechercher un utilisateur..."
      />

      <AlertDialog isOpen={isOpen} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Confirmer le changement</AlertDialogHeader>
            <AlertDialogBody>
              Êtes-vous sûr de vouloir {selectedUser?.is_admin ? 'retirer' : 'ajouter'} les
              droits administrateur pour {selectedUser?.name} ?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onClose}>Annuler</Button>
              <Button
                colorScheme="blue"
                onClick={confirmToggleAdmin}
                ml={3}
                isLoading={toggleAdminMutation.isLoading}
              >
                Confirmer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};
