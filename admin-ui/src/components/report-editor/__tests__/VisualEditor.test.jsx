import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualEditor } from '../VisualEditor';
import { ChakraProvider } from '@chakra-ui/react';

const mockOnChange = jest.fn();
const mockOnPreview = jest.fn();

const defaultProps = {
  initialData: {
    name: '',
    description: '',
    type: '',
    config: {
      sections: [],
      filters: {}
    }
  },
  onChange: mockOnChange,
  onPreview: mockOnPreview
};

const renderWithChakra = (ui) => {
  return render(
    <ChakraProvider>{ui}</ChakraProvider>
  );
};

describe('VisualEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic form fields', () => {
    renderWithChakra(<VisualEditor {...defaultProps} />);

    expect(screen.getByLabelText(/nom du modèle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  });

  it('updates form data when fields change', async () => {
    renderWithChakra(<VisualEditor {...defaultProps} />);

    const nameInput = screen.getByLabelText(/nom du modèle/i);
    const descInput = screen.getByLabelText(/description/i);
    const typeSelect = screen.getByLabelText(/type/i);

    await userEvent.type(nameInput, 'Test Report');
    await userEvent.type(descInput, 'Test Description');
    await userEvent.selectOptions(typeSelect, 'works');

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Report',
      description: 'Test Description',
      type: 'works'
    }));
  });

  it('shows validation warning when trying to preview without required fields', async () => {
    renderWithChakra(<VisualEditor {...defaultProps} />);

    const previewButton = screen.getByText(/prévisualiser/i);
    await userEvent.click(previewButton);

    expect(await screen.findByText(/veuillez remplir tous les champs requis/i)).toBeInTheDocument();
    expect(mockOnPreview).not.toHaveBeenCalled();
  });

  it('calls onPreview with complete data when form is valid', async () => {
    const validData = {
      name: 'Test Report',
      description: 'Test Description',
      type: 'works',
      config: {
        sections: [{
          type: 'summary',
          title: 'Test Summary',
          metrics: ['total_works']
        }],
        filters: {}
      }
    };

    renderWithChakra(
      <VisualEditor
        {...defaultProps}
        initialData={validData}
      />
    );

    const previewButton = screen.getByText(/prévisualiser/i);
    await userEvent.click(previewButton);

    expect(mockOnPreview).toHaveBeenCalledWith(validData);
  });

  it('switches between tabs correctly', async () => {
    renderWithChakra(<VisualEditor {...defaultProps} />);

    const sectionsTab = screen.getByText(/sections/i);
    const filtersTab = screen.getByText(/filtres/i);

    await userEvent.click(sectionsTab);
    expect(screen.getByText(/ajouter un résumé/i)).toBeInTheDocument();

    await userEvent.click(filtersTab);
    expect(screen.getByText(/ajouter un filtre/i)).toBeInTheDocument();
  });
});
