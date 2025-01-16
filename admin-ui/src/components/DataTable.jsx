import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Flex,
  Button,
  Input,
  Select,
  Text,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

export const DataTable = ({
  columns,
  data,
  isLoading,
  pagination,
  onPageChange,
  onLimitChange,
  onSearch,
  searchPlaceholder
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={bgColor}
      shadow="sm"
      rounded="lg"
      overflow="hidden"
      border="1px"
      borderColor={borderColor}
    >
      {}
      <Flex p="4" justify="space-between" align="center" borderBottomWidth="1px">
        <Flex align="center" gap="4">
          <Select
            w="auto"
            size="sm"
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            <option value="10">10 par page</option>
            <option value="25">25 par page</option>
            <option value="50">50 par page</option>
          </Select>
          <Text fontSize="sm" color="gray.600">
            Total: {pagination.total}
          </Text>
        </Flex>
        {onSearch && (
          <Input
            placeholder={searchPlaceholder}
            size="sm"
            w="auto"
            maxW="xs"
            onChange={(e) => onSearch(e.target.value)}
          />
        )}
      </Flex>

      {}
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th key={column.key}>{column.label}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={columns.length}>
                  <Flex justify="center" py="4">
                    <Spinner />
                  </Flex>
                </Td>
              </Tr>
            ) : data.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length}>
                  <Text textAlign="center" py="4" color="gray.500">
                    Aucune donnée disponible
                  </Text>
                </Td>
              </Tr>
            ) : (
              data.map((item, index) => (
                <Tr key={item.id || index}>
                  {columns.map((column) => (
                    <Td key={column.key}>
                      {column.render
                        ? column.render(item[column.key], item)
                        : item[column.key]}
                    </Td>
                  ))}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {}
      <Flex p="4" justify="space-between" align="center" borderTopWidth="1px">
        <Text fontSize="sm" color="gray.600">
          Page {pagination.page} sur {pagination.pages}
        </Text>
        <Flex gap="2">
          <Button
            size="sm"
            leftIcon={<ChevronLeftIcon />}
            onClick={() => onPageChange(pagination.page - 1)}
            isDisabled={pagination.page <= 1}
          >
            Précédent
          </Button>
          <Button
            size="sm"
            rightIcon={<ChevronRightIcon />}
            onClick={() => onPageChange(pagination.page + 1)}
            isDisabled={pagination.page >= pagination.pages}
          >
            Suivant
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};
