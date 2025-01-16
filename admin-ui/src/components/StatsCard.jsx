import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue
} from '@chakra-ui/react';

export const StatsCard = ({ label, value, change, icon: Icon }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p="6"
      bg={bgColor}
      shadow="sm"
      rounded="lg"
      border="1px"
      borderColor={borderColor}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="3"
        right="3"
        color={useColorModeValue('gray.300', 'gray.600')}
      >
        <Icon boxSize="8" />
      </Box>
      <Stat>
        <StatLabel color="gray.500" fontSize="sm">
          {label}
        </StatLabel>
        <StatNumber fontSize="2xl" fontWeight="bold" mt="2">
          {value}
        </StatNumber>
        {change && (
          <StatHelpText mb="0">
            <StatArrow
              type={change >= 0 ? 'increase' : 'decrease'}
              color={change >= 0 ? 'green.500' : 'red.500'}
            />
            {Math.abs(change)}%
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
};
