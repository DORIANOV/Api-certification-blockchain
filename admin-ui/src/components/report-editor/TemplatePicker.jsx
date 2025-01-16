import {
  Box,
  SimpleGrid,
  Button,
  Text,
  useColorModeValue,
  Icon,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import {
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiList,
  FiGrid,
  FiActivity,
  FiDollarSign,
  FiUsers,
  FiCalendar
} from 'react-icons/fi';

// Modèles de sections prédéfinis
const SECTION_TEMPLATES = {
  works: [
    {
      id: 'works-overview',
      name: 'Vue d\'ensemble des œuvres',
      icon: FiGrid,
      template: {
        type: 'summary',
        title: 'Vue d\'ensemble',
        metrics: ['total_works', 'new_works', 'active_users']
      }
    },
    {
      id: 'works-by-category',
      name: 'Distribution par catégorie',
      icon: FiPieChart,
      template: {
        type: 'chart',
        title: 'Distribution par catégorie',
        chartType: 'pie',
        data: { query: 'category_distribution' }
      }
    },
    {
      id: 'works-trend',
      name: 'Tendance des créations',
      icon: FiTrendingUp,
      template: {
        type: 'chart',
        title: 'Tendance des nouvelles œuvres',
        chartType: 'line',
        data: { query: 'works_trend' }
      }
    },
    {
      id: 'recent-works',
      name: 'Œuvres récentes',
      icon: FiList,
      template: {
        type: 'table',
        title: 'Dernières œuvres ajoutées',
        columns: ['title', 'creator', 'category', 'created_at'],
        sort: { column: 'created_at', direction: 'desc' },
        limit: 10
      }
    }
  ],
  royalties: [
    {
      id: 'royalties-overview',
      name: 'Vue d\'ensemble des royalties',
      icon: FiDollarSign,
      template: {
        type: 'summary',
        title: 'Vue d\'ensemble',
        metrics: ['total_royalties', 'total_distributions', 'unique_recipients']
      }
    },
    {
      id: 'royalties-trend',
      name: 'Tendance des distributions',
      icon: FiTrendingUp,
      template: {
        type: 'chart',
        title: 'Tendance des distributions',
        chartType: 'line',
        data: { query: 'royalties_trend' }
      }
    },
    {
      id: 'top-earners',
      name: 'Top des bénéficiaires',
      icon: FiBarChart2,
      template: {
        type: 'chart',
        title: 'Top 10 des bénéficiaires',
        chartType: 'bar',
        data: { query: 'top_earners' }
      }
    },
    {
      id: 'recent-distributions',
      name: 'Distributions récentes',
      icon: FiList,
      template: {
        type: 'table',
        title: 'Dernières distributions',
        columns: ['recipient', 'amount', 'work_title', 'distributed_at'],
        sort: { column: 'distributed_at', direction: 'desc' },
        limit: 10
      }
    }
  ],
  analytics: [
    {
      id: 'user-activity',
      name: 'Activité utilisateur',
      icon: FiUsers,
      template: {
        type: 'summary',
        title: 'Vue d\'ensemble',
        metrics: ['active_users', 'new_users', 'total_interactions']
      }
    },
    {
      id: 'activity-trend',
      name: 'Tendance de l\'activité',
      icon: FiActivity,
      template: {
        type: 'chart',
        title: 'Tendance de l\'activité',
        chartType: 'line',
        data: { query: 'activity_trend' }
      }
    },
    {
      id: 'daily-stats',
      name: 'Statistiques journalières',
      icon: FiCalendar,
      template: {
        type: 'chart',
        title: 'Statistiques journalières',
        chartType: 'bar',
        data: { query: 'daily_stats' }
      }
    },
    {
      id: 'user-actions',
      name: 'Actions utilisateur',
      icon: FiList,
      template: {
        type: 'table',
        title: 'Dernières actions',
        columns: ['user', 'action', 'target', 'timestamp'],
        sort: { column: 'timestamp', direction: 'desc' },
        limit: 10
      }
    }
  ]
};

const TemplateCard = ({ template, onClick }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Button
      w="100%"
      h="auto"
      p="4"
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      onClick={() => onClick(template)}
      display="block"
      textAlign="left"
      _hover={{
        transform: 'translateY(-2px)',
        shadow: 'md'
      }}
      transition="all 0.2s"
    >
      <VStack align="start" spacing="2">
        <Icon as={template.icon} boxSize="6" color="blue.500" />
        <Text fontWeight="medium">{template.name}</Text>
      </VStack>
    </Button>
  );
};

export const TemplatePicker = ({ reportType, onSelect }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const templates = SECTION_TEMPLATES[reportType] || [];

  const handleSelect = (template) => {
    onSelect(template.template);
    onClose();
  };

  return (
    <>
      <Button
        leftIcon={<Icon as={FiGrid} />}
        onClick={onOpen}
        colorScheme="blue"
        variant="outline"
        w="100%"
      >
        Utiliser un modèle
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Choisir un modèle de section</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb="6">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={handleSelect}
                />
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
