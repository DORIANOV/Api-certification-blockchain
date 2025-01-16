import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Heading,
  SimpleGrid,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Text,
  Badge,
  Flex,
  Link,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { ExternalLinkIcon, ViewIcon } from '@chakra-ui/icons';
import { DataTable } from '../components/DataTable';
import { Chart } from '../components/Chart';
import { adminApi } from '../services/api';
import { formatCurrency } from '../utils/format';

export const Works = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedWork, setSelectedWork] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Récupération des œuvres
  const { data, isLoading } = useQuery(
    ['admin', 'works', { page, limit, search: searchTerm }],
    () =>
      adminApi.getWorks({ page, limit, search: searchTerm }).then((res) => res.data.data),
    {
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les œuvres',
          status: 'error'
        });
      }
    }
  );

  // Récupération des statistiques des œuvres
  const { data: stats } = useQuery(
    ['admin', 'works', 'stats'],
    () => adminApi.getWorksStats().then((res) => res.data.data),
    {
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les statistiques',
          status: 'error'
        });
      }
    }
  );

  const handleViewDetails = (work) => {
    setSelectedWork(work);
    onOpen();
  };

  // Configuration du graphique des royalties
  const royaltiesChartData = {
    labels: stats?.royaltiesOverTime?.map((item) => item.date) ?? [],
    datasets: [
      {
        label: 'Royalties distribuées',
        data: stats?.royaltiesOverTime?.map((item) => item.amount) ?? [],
        borderColor: '#4299E1',
        backgroundColor: 'rgba(66, 153, 225, 0.2)',
        fill: true
      }
    ]
  };

  // Configuration du graphique des catégories
  const categoriesChartData = {
    labels: stats?.categoriesDistribution?.map((item) => item.category) ?? [],
    datasets: [
      {
        data: stats?.categoriesDistribution?.map((item) => item.count) ?? [],
        backgroundColor: [
          '#4299E1',
          '#48BB78',
          '#ED8936',
          '#9F7AEA',
          '#F56565'
        ]
      }
    ]
  };

  const columns = [
    {
      key: 'title',
      label: 'Titre',
      render: (value, work) => (
        <Flex align="center">
          {work.thumbnail && (
            <Image
              src={work.thumbnail}
              alt={value}
              boxSize="40px"
              objectFit="cover"
              mr="3"
              rounded="md"
            />
          )}
          <Text>{value}</Text>
        </Flex>
      )
    },
    { 
      key: 'creator_name',
      label: 'Créateur'
    },
    {
      key: 'total_royalties',
      label: 'Royalties totales',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'created_at',
      label: 'Date de création',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value) => (
        <Badge
          colorScheme={value === 'active' ? 'green' : 'gray'}
          variant="subtle"
        >
          {value === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, work) => (
        <Flex gap="2">
          <Tooltip label="Voir les détails">
            <IconButton
              icon={<ViewIcon />}
              size="sm"
              onClick={() => handleViewDetails(work)}
            />
          </Tooltip>
          <Tooltip label="Voir sur la blockchain">
            <Link
              href={`https://polygonscan.com/token/${work.token_id}`}
              isExternal
            >
              <IconButton
                icon={<ExternalLinkIcon />}
                size="sm"
              />
            </Link>
          </Tooltip>
        </Flex>
      )
    }
  ];

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="8">
        <Heading size="lg">Gestion des œuvres</Heading>
      </Flex>

      {/* Graphiques */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="6" mb="8">
        <Box>
          <Heading size="md" mb="4">
            Distribution des royalties
          </Heading>
          <Chart
            type="line"
            data={royaltiesChartData}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => formatCurrency(value)
                  }
                }
              }
            }}
          />
        </Box>
        <Box>
          <Heading size="md" mb="4">
            Distribution par catégorie
          </Heading>
          <Chart
            type="doughnut"
            data={categoriesChartData}
            options={{
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }}
          />
        </Box>
      </SimpleGrid>

      {/* Liste des œuvres */}
      <DataTable
        columns={columns}
        data={data?.works ?? []}
        isLoading={isLoading}
        pagination={data?.pagination ?? {}}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearch={setSearchTerm}
        searchPlaceholder="Rechercher une œuvre..."
      />

      {/* Modal de détails */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedWork?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            {selectedWork && (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing="6">
                <Box>
                  {selectedWork.image && (
                    <Image
                      src={selectedWork.image}
                      alt={selectedWork.title}
                      rounded="lg"
                      mb="4"
                    />
                  )}
                  <Text fontWeight="bold">Description</Text>
                  <Text color="gray.600" mb="4">
                    {selectedWork.description}
                  </Text>
                  <Link
                    href={selectedWork.metadata_uri}
                    isExternal
                    color="blue.500"
                  >
                    Voir les métadonnées <ExternalLinkIcon mx="2px" />
                  </Link>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb="2">
                    Détails
                  </Text>
                  <SimpleGrid columns={2} spacing="4">
                    <Text color="gray.600">Token ID</Text>
                    <Text>{selectedWork.token_id}</Text>
                    <Text color="gray.600">Créateur</Text>
                    <Text>{selectedWork.creator_name}</Text>
                    <Text color="gray.600">Royalties totales</Text>
                    <Text>{formatCurrency(selectedWork.total_royalties)}</Text>
                    <Text color="gray.600">Date de création</Text>
                    <Text>
                      {new Date(selectedWork.created_at).toLocaleDateString()}
                    </Text>
                  </SimpleGrid>
                </Box>
              </SimpleGrid>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
