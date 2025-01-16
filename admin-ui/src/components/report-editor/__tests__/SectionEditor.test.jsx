import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionEditor } from '../SectionEditor';
import { ChakraProvider } from '@chakra-ui/react';

const mockOnChange = jest.fn();
const mockOnReorder = jest.fn();

const defaultProps = {
  sections: [],
  onChange: mockOnChange,
  onReorder: mockOnReorder,
  formData: {
    type: 'works'
  }
};

const renderWithChakra = (ui) => {
  return render(
    <ChakraProvider>{ui}</ChakraProvider>
  );
};

describe('SectionEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders add section buttons', () => {
    renderWithChakra(<SectionEditor {...defaultProps} />);

    expect(screen.getByText(/utiliser un modèle/i)).toBeInTheDocument();
    expect(screen.getByText(/ajouter un résumé/i)).toBeInTheDocument();
    expect(screen.getByText(/ajouter un graphique/i)).toBeInTheDocument();
    expect(screen.getByText(/ajouter un tableau/i)).toBeInTheDocument();
  });

  it('adds a summary section with correct default values', async () => {
    renderWithChakra(<SectionEditor {...defaultProps} />);

    const addSummaryButton = screen.getByText(/ajouter un résumé/i);
    await userEvent.click(addSummaryButton);

    expect(mockOnChange).toHaveBeenCalledWith([{
      type: 'summary',
      metrics: []
    }]);
  });

  it('adds a chart section with correct default values', async () => {
    renderWithChakra(<SectionEditor {...defaultProps} />);

    const addChartButton = screen.getByText(/ajouter un graphique/i);
    await userEvent.click(addChartButton);

    expect(mockOnChange).toHaveBeenCalledWith([{
      type: 'chart',
      chartType: 'line',
      data: { query: '' }
    }]);
  });

  it('adds a table section with correct default values', async () => {
    renderWithChakra(<SectionEditor {...defaultProps} />);

    const addTableButton = screen.getByText(/ajouter un tableau/i);
    await userEvent.click(addTableButton);

    expect(mockOnChange).toHaveBeenCalledWith([{
      type: 'table',
      columns: [],
      sort: { column: '', direction: 'desc' },
      limit: 10
    }]);
  });

  it('renders existing sections', () => {
    const sections = [
      {
        type: 'summary',
        title: 'Test Summary',
        metrics: ['total_works']
      },
      {
        type: 'chart',
        title: 'Test Chart',
        chartType: 'line',
        data: { query: 'works_trend' }
      }
    ];

    renderWithChakra(
      <SectionEditor
        {...defaultProps}
        sections={sections}
      />
    );

    expect(screen.getByText(/section 1: summary/i)).toBeInTheDocument();
    expect(screen.getByText(/section 2: chart/i)).toBeInTheDocument();
  });

  it('allows section deletion', async () => {
    const sections = [
      {
        type: 'summary',
        title: 'Test Summary',
        metrics: ['total_works']
      }
    ];

    renderWithChakra(
      <SectionEditor
        {...defaultProps}
        sections={sections}
      />
    );

    const deleteButton = screen.getByLabelText(/delete section/i);
    await userEvent.click(deleteButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('expands section details when clicked', async () => {
    const sections = [
      {
        type: 'summary',
        title: 'Test Summary',
        metrics: ['total_works']
      }
    ];

    renderWithChakra(
      <SectionEditor
        {...defaultProps}
        sections={sections}
      />
    );

    const toggleButton = screen.getByLabelText(/toggle section/i);
    await userEvent.click(toggleButton);

    expect(screen.getByLabelText(/titre/i)).toBeInTheDocument();
  });
});
