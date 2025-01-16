import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Heading,
  SimpleGrid,
  useToast,
  Flex
} from '@chakra-ui/react';
import { FiUsers, FiFileText, FiDollarSign, FiActivity } from 'react-icons/fi';
import { StatsCard } from '../components/StatsCard';
import { DataTable } from '../components/DataTable';
import { adminApi } from '../services/api';
import { formatCurrency } from '../utils/format';

const transactionColumns = [
  { key: 'created_at', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
  { key: 'work_title', label: 'Œuvre' },
  { key: 'creator_name', label: 'Créateur' },
  { key: 'amount', label: 'Montant', render: (value) => formatCurrency(value) },
  { key: 'transaction_hash', label: 'Transaction', render: (value) => `${value.slice(0, 6)}...${value.slice(-4)}` }
];

export const Dashboard = () => {
  const toast = useToast();

  const { data: stats, isLoading: isLoadingStats } = useQuery(
    ['admin', 'stats'],
    () => adminApi.getStats().then((res) => res.data.data),
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

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery(
    ['admin', 'transactions', { limit: 5 }],
    () => adminApi.getTransactions({ limit: 5 }).then((res) => res.data.data),
    {
      onError: () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les transactions',
          status: 'error'
        });
      }
    }
  );

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="8">
        <Heading size="lg">Tableau de bord</Heading>
      </Flex>

      {}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="6" mb="8">
        <StatsCard
          label="Utilisateurs totaux"
          value={stats?.totalUsers ?? '-'}
          icon={FiUsers}
        />
        <StatsCard
          label="Œuvres enregistrées"
          value={stats?.totalWorks ?? '-'}
          icon={FiFileText}
        />
        <StatsCard
          label="Volume de royalties"
          value={formatCurrency(stats?.totalRoyalties ?? 0)}
          icon={FiDollarSign}
        />
        <StatsCard
          label="Utilisateurs actifs"
          value={stats?.activeUsers ?? '-'}
          icon={FiActivity}
        />
      </SimpleGrid>

      {}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap="6" mb="8">
        {}
      </Grid>

      {}
      <Box mb="8">
        <Heading size="md" mb="4">
          Dernières transactions
        </Heading>
        <DataTable
          columns={transactionColumns}
          data={transactions?.transactions ?? []}
          isLoading={isLoadingTransactions}
          pagination={transactions?.pagination ?? {}}
          onPageChange={() => {}}
          onLimitChange={() => {}}
        />
      </Box>
    </Box>
  );
};
