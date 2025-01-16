import { useRef, useEffect } from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { Chart as ChartJS } from 'chart.js/auto';

export const Chart = ({ type, data, options = {}, height = '300px' }) => {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new ChartJS(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: useColorModeValue('#2D3748', '#CBD5E0')
            }
          },
          ...options.plugins
        }
      }
    });
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data, options]);

  return (
    <Box
      bg={bgColor}
      p="4"
      rounded="lg"
      border="1px"
      borderColor={borderColor}
      height={height}
    >
      <canvas ref={canvasRef} />
    </Box>
  );
};
