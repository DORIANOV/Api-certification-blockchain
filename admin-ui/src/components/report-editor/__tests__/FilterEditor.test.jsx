import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterEditor } from '../FilterEditor';
import { ChakraProvider } from '@chakra-ui/react';

const mockOnChange = jest.fn();

const defaultProps = {
  filters: {},
  onChange: mockOnChange
};

const renderWithChakra = (ui) => {
  return render(
    <ChakraProvider>{ui}</ChakraProvider>
  );
};

describe('FilterEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders add filter buttons', () => {
    renderWithChakra(<FilterEditor {...defaultProps} />);

    expect(screen.getByText(/ajouter un filtre/i)).toBeInTheDocument();
    expect(screen.getByText(/période/i)).toBeInTheDocument();
    expect(screen.getByText(/catégorie/i)).toBeInTheDocument();
    expect(screen.getByText(/montant minimum/i)).toBeInTheDocument();
  });

  it('adds a period filter with default value', async () => {
    renderWithChakra(<FilterEditor {...defaultProps} />);

    const periodButton = screen.getByText(/période/i);
    await userEvent.click(periodButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      period: '1M'
    });
  });

  it('adds a category filter with default value', async () => {
    renderWithChakra(<FilterEditor {...defaultProps} />);

    const categoryButton = screen.getByText(/catégorie/i);
    await userEvent.click(categoryButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      category: ''
    });
  });

  it('renders existing filters', () => {
    const filters = {
      period: '1M',
      category: 'image'
    };

    renderWithChakra(
      <FilterEditor
        {...defaultProps}
        filters={filters}
      />
    );

    expect(screen.getByText(/période/i)).toBeInTheDocument();
    expect(screen.getByText(/catégorie/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('1M')).toBeInTheDocument();
    expect(screen.getByDisplayValue('image')).toBeInTheDocument();
  });

  it('allows filter deletion', async () => {
    const filters = {
      period: '1M'
    };

    renderWithChakra(
      <FilterEditor
        {...defaultProps}
        filters={filters}
      />
    );

    const deleteButton = screen.getByLabelText(/remove filter/i);
    await userEvent.click(deleteButton);

    expect(mockOnChange).toHaveBeenCalledWith({});
  });

  it('updates filter value when changed', async () => {
    const filters = {
      period: '1M'
    };

    renderWithChakra(
      <FilterEditor
        {...defaultProps}
        filters={filters}
      />
    );

    const select = screen.getByDisplayValue('1M');
    await userEvent.selectOptions(select, '7d');

    expect(mockOnChange).toHaveBeenCalledWith({
      period: '7d'
    });
  });

  it('limits the number of filters that can be added', async () => {
    const filters = {
      period: '1M',
      category: 'image',
      minAmount: 100,
      status: 'active',
      creator: 'John'
    };

    renderWithChakra(
      <FilterEditor
        {...defaultProps}
        filters={filters}
      />
    );

    expect(screen.queryByText(/ajouter un filtre/i)).not.toBeInTheDocument();
  });

  it('renders correct input type for different filters', () => {
    const filters = {
      minAmount: 100,
      creator: 'John'
    };

    renderWithChakra(
      <FilterEditor
        {...defaultProps}
        filters={filters}
      />
    );

    expect(screen.getByDisplayValue('100')).toHaveAttribute('type', 'number');
    expect(screen.getByDisplayValue('John')).toHaveAttribute('type', 'text');
  });
});
