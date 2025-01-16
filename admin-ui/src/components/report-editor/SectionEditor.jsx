import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  SimpleGrid,
  IconButton,
  useColorModeValue,
  Collapse,
  Text,
  HStack,
  Divider
} from '@chakra-ui/react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DeleteIcon,
  DragHandleIcon
} from '@chakra-ui/icons';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { TemplatePicker } from './TemplatePicker';

const CHART_TYPES = [
  { value: 'line', label: 'Ligne' },
  { value: 'bar', label: 'Barres' },
  { value: 'pie', label: 'Camembert' },
  { value: 'doughnut', label: 'Anneau' },
  { value: 'radar', label: 'Radar' }
];

const METRIC_OPTIONS = [
  { value: 'total_works', label: 'Total des œuvres' },
  { value: 'new_works', label: 'Nouvelles œuvres' },
  { value: 'total_royalties', label: 'Total des royalties' },
  { value: 'active_users', label: 'Utilisateurs actifs' },
  { value: 'total_distributions', label: 'Total des distributions' },
  { value: 'unique_recipients', label: 'Destinataires uniques' }
];

const DATA_QUERIES = [
  { value: 'category_distribution', label: 'Distribution par catégorie' },
  { value: 'royalties_trend', label: 'Tendance des royalties' },
  { value: 'user_activity', label: 'Activité utilisateur' },
  { value: 'transaction_volume', label: 'Volume des transactions' }
];

const TABLE_COLUMNS = [
  { value: 'title', label: 'Titre' },
  { value: 'creator', label: 'Créateur' },
  { value: 'royalties', label: 'Royalties' },
  { value: 'created_at', label: 'Date de création' },
  { value: 'category', label: 'Catégorie' },
  { value: 'status', label: 'Statut' }
];

export const SectionEditor = ({ sections, onChange, onReorder, formData }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSectionChange = (index, field, value) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      [field]: value
    };
    onChange(newSections);
  };

  const handleAddSection = (type) => {
    const newSection = {
      type,
      title: '',
      ...(type === 'summary' && { metrics: [] }),
      ...(type === 'chart' && {
        chartType: 'line',
        data: { query: '' }
      }),
      ...(type === 'table' && {
        columns: [],
        sort: { column: '', direction: 'desc' },
        limit: 10
      })
    };
    onChange([...sections, newSection]);
    setExpandedSection(sections.length);
  };

  const handleDeleteSection = (index) => {
    const newSections = sections.filter((_, i) => i !== index);
    onChange(newSections);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <VStack
              spacing="4"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {sections.map((section, index) => (
                <Draggable
                  key={index}
                  draggableId={`section-${index}`}
                  index={index}
                >
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      w="100%"
                    >
                      <Box
                        p="4"
                        bg={bgColor}
                        borderRadius="lg"
                        border="1px"
                        borderColor={borderColor}
                      >
                        <HStack mb="2">
                          <Box {...provided.dragHandleProps}>
                            <DragHandleIcon />
                          </Box>
                          <Text fontWeight="medium">
                            Section {index + 1}: {section.type}
                          </Text>
                          <IconButton
                            size="sm"
                            icon={expandedSection === index ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                            aria-label="Toggle section"
                          />
                          <IconButton
                            size="sm"
                            icon={<DeleteIcon />}
                            onClick={() => handleDeleteSection(index)}
                            colorScheme="red"
                            aria-label="Delete section"
                          />
                        </HStack>

                        <Collapse in={expandedSection === index}>
                          <VStack spacing="4" align="stretch">
                            <FormControl>
                              <FormLabel>Titre</FormLabel>
                              <Input
                                value={section.title}
                                onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                                placeholder="Titre de la section"
                              />
                            </FormControl>

                            {section.type === 'summary' && (
                              <FormControl>
                                <FormLabel>Métriques</FormLabel>
                                <Select
                                  isMulti
                                  options={METRIC_OPTIONS}
                                  value={METRIC_OPTIONS.filter(opt => section.metrics.includes(opt.value))}
                                  onChange={(selected) => handleSectionChange(
                                    index,
                                    'metrics',
                                    selected.map(opt => opt.value)
                                  )}
                                  placeholder="Sélectionner les métriques"
                                />
                              </FormControl>
                            )}

                            {section.type === 'chart' && (
                              <>
                                <FormControl>
                                  <FormLabel>Type de graphique</FormLabel>
                                  <Select
                                    value={section.chartType}
                                    onChange={(e) => handleSectionChange(index, 'chartType', e.target.value)}
                                  >
                                    {CHART_TYPES.map(type => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </Select>
                                </FormControl>

                                <FormControl>
                                  <FormLabel>Source de données</FormLabel>
                                  <Select
                                    value={section.data.query}
                                    onChange={(e) => handleSectionChange(
                                      index,
                                      'data',
                                      { ...section.data, query: e.target.value }
                                    )}
                                  >
                                    <option value="">Sélectionner une source</option>
                                    {DATA_QUERIES.map(query => (
                                      <option key={query.value} value={query.value}>
                                        {query.label}
                                      </option>
                                    ))}
                                  </Select>
                                </FormControl>
                              </>
                            )}

                            {section.type === 'table' && (
                              <>
                                <FormControl>
                                  <FormLabel>Colonnes</FormLabel>
                                  <Select
                                    isMulti
                                    options={TABLE_COLUMNS}
                                    value={TABLE_COLUMNS.filter(col => section.columns.includes(col.value))}
                                    onChange={(selected) => handleSectionChange(
                                      index,
                                      'columns',
                                      selected.map(col => col.value)
                                    )}
                                    placeholder="Sélectionner les colonnes"
                                  />
                                </FormControl>

                                <SimpleGrid columns={2} spacing="4">
                                  <FormControl>
                                    <FormLabel>Trier par</FormLabel>
                                    <Select
                                      value={section.sort.column}
                                      onChange={(e) => handleSectionChange(
                                        index,
                                        'sort',
                                        { ...section.sort, column: e.target.value }
                                      )}
                                    >
                                      <option value="">Sélectionner une colonne</option>
                                      {section.columns.map(col => (
                                        <option key={col} value={col}>
                                          {TABLE_COLUMNS.find(c => c.value === col)?.label}
                                        </option>
                                      ))}
                                    </Select>
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel>Ordre</FormLabel>
                                    <Select
                                      value={section.sort.direction}
                                      onChange={(e) => handleSectionChange(
                                        index,
                                        'sort',
                                        { ...section.sort, direction: e.target.value }
                                      )}
                                    >
                                      <option value="asc">Croissant</option>
                                      <option value="desc">Décroissant</option>
                                    </Select>
                                  </FormControl>
                                </SimpleGrid>

                                <FormControl>
                                  <FormLabel>Limite</FormLabel>
                                  <Input
                                    type="number"
                                    value={section.limit}
                                    onChange={(e) => handleSectionChange(index, 'limit', parseInt(e.target.value))}
                                    min="1"
                                    max="100"
                                  />
                                </FormControl>
                              </>
                            )}
                          </VStack>
                        </Collapse>
                      </Box>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </VStack>
          )}
        </Droppable>
      </DragDropContext>

      <Divider my="6" />

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing="4">
        <TemplatePicker
          reportType={formData?.type}
          onSelect={(template) => handleAddSection(template)}
        />
        <Button
          onClick={() => handleAddSection({ type: 'summary', metrics: [] })}
          variant="outline"
        >
          + Ajouter un résumé
        </Button>
        <Button
          onClick={() => handleAddSection({
            type: 'chart',
            chartType: 'line',
            data: { query: '' }
          })}
          variant="outline"
        >
          + Ajouter un graphique
        </Button>
        <Button
          onClick={() => handleAddSection({
            type: 'table',
            columns: [],
            sort: { column: '', direction: 'desc' },
            limit: 10
          })}
          variant="outline"
        >
          + Ajouter un tableau
        </Button>
      </SimpleGrid>
    </Box>
  );
};
