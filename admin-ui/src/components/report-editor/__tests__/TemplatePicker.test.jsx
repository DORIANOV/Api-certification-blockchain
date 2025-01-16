import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplatePicker } from '../TemplatePicker';
import { ChakraProvider } from '@chakra-ui/react';

const mockOnSelect = jest.fn();

const defaultProps = {
  reportType: 'works',
  onSelect: mockOnSelect
};

const renderWithChakra = (ui) => {
  return render(
    <ChakraProvider>{ui}</ChakraProvider>
  );
};

describe('TemplatePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders template button', () => {
    renderWithChakra(<TemplatePicker {...defaultProps} />);

    expect(screen.getByText(/utiliser un modèle/i)).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    renderWithChakra(<TemplatePicker {...defaultProps} />);

    const button = screen.getByText(/utiliser un modèle/i);
    await userEvent.click(button);

    expect(screen.getByText(/choisir un modèle de section/i)).toBeInTheDocument();
  });

  it('renders work templates when type is works', async () => {
    renderWithChakra(<TemplatePicker {...defaultProps} />);

    const button = screen.getByText(/utiliser un modèle/i);
    await userEvent.click(button);

    expect(screen.getByText(/vue d'ensemble des œuvres/i)).toBeInTheDocument();
    expect(screen.getByText(/distribution par catégorie/i)).toBeInTheDocument();
    expect(screen.getByText(/tendance des créations/i)).toBeInTheDocument();
    expect(screen.getByText(/œuvres récentes/i)).toBeInTheDocument();
  });

  it('renders royalty templates when type is royalties', async () => {
    renderWithChakra(
      <TemplatePicker
        {...defaultProps}
        reportType="royalties"
      />
    );

    const button = screen.getByText(/utiliser un modèle/i);
    await userEvent.click(button);

    expect(screen.getByText(/vue d'ensemble des royalties/i)).toBeInTheDocument();
    expect(screen.getByText(/tendance des distributions/i)).toBeInTheDocument();
    expect(screen.getByText(/top des bénéficiaires/i)).toBeInTheDocument();
    expect(screen.getByText(/distributions récentes/i)).toBeInTheDocument();
  });

  it('renders analytics templates when type is analytics', async () => {
    renderWithChakra(
      <TemplatePicker
        {...defaultProps}
        reportType="analytics"
      />
    );

    const button = screen.getByText(/utiliser un modèle/i);
    await userEvent.click(button);

    expect(screen.getByText(/activité utilisateur/i)).toBeInTheDocument();
    expect(screen.getByText(/tendance de l'activité/i)).toBeInTheDocument();
    expect(screen.getByText(/statistiques journalières/i)).toBeInTheDocument();
    expect(screen.getByText(/actions utilisateur/i)).toBeInTheDocument();
  });

  it('calls onSelect with template data when template is clicked', async () => {
    renderWithChakra(<TemplatePicker {...defaultProps} />);

    const button = screen.getByText(/utiliser un modèle/i);
    await userEvent.click(button);

    const templateButton = screen.getByText(/vue d'ensemble des œuvres/i);
    await userEvent.click(templateButton);

    expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({
      type: 'summary',
      title: 'Vue d\'ensemble',
      metrics: ['total_works', 'new_works', 'active_users']
    }));
  });

  it('closes modal after template selection', async () => {
    renderWithChakra(<TemplatePicker {...defaultProps} />);

    const button = screen.getByText(/utiliser un modèle/i);
    await userEvent.click(button);

    const templateButton = screen.getByText(/vue d'ensemble des œuvres/i);
    await userEvent.click(templateButton);

    expect(screen.queryByText(/choisir un modèle de section/i)).not.toBeInTheDocument();
  });
});
