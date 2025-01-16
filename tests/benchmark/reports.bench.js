const Benchmark = require('benchmark');
const { generateReport } = require('../../src/services/report-generator');
const { validateTemplate } = require('../../src/validators/report-templates');
const { createTestTemplate } = require('../helpers');

const suite = new Benchmark.Suite;

// Données de test
const testTemplate = {
  name: 'Benchmark Template',
  type: 'works',
  config: {
    sections: [
      {
        type: 'summary',
        metrics: ['total_works', 'new_works', 'active_users']
      },
      {
        type: 'chart',
        chartType: 'line',
        data: { query: 'works_trend' }
      },
      {
        type: 'table',
        columns: ['title', 'creator', 'created_at'],
        sort: { column: 'created_at', direction: 'desc' },
        limit: 10
      }
    ],
    filters: {
      period: '1M',
      category: 'image'
    }
  }
};

// Tests de performance
suite
  .add('Template Validation', {
    defer: true,
    fn: async (deferred) => {
      await validateTemplate(testTemplate);
      deferred.resolve();
    }
  })
  .add('Report Generation - Small', {
    defer: true,
    fn: async (deferred) => {
      await generateReport(testTemplate, { limit: 100 });
      deferred.resolve();
    }
  })
  .add('Report Generation - Medium', {
    defer: true,
    fn: async (deferred) => {
      await generateReport(testTemplate, { limit: 1000 });
      deferred.resolve();
    }
  })
  .add('Report Generation - Large', {
    defer: true,
    fn: async (deferred) => {
      await generateReport(testTemplate, { limit: 5000 });
      deferred.resolve();
    }
  })
  .add('Chart Data Processing', {
    defer: true,
    fn: async (deferred) => {
      const data = await generateReport(testTemplate, { section: 'chart' });
      deferred.resolve();
    }
  })
  .add('Table Data Processing', {
    defer: true,
    fn: async (deferred) => {
      const data = await generateReport(testTemplate, { section: 'table' });
      deferred.resolve();
    }
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));

    // Analyser les résultats
    const results = this.filter('successful').map(benchmark => ({
      name: benchmark.name,
      hz: benchmark.hz,
      rme: benchmark.stats.rme,
      samples: benchmark.stats.sample.length,
      mean: benchmark.stats.mean,
      deviation: benchmark.stats.deviation
    }));

    // Sauvegarder les résultats
    require('fs').writeFileSync(
      'benchmark-results.json',
      JSON.stringify(results, null, 2)
    );
  })
  .run({ async: true });

// Tests de mémoire
const { heapUsed } = process.memoryUsage();
console.log(`Memory usage before tests: ${Math.round(heapUsed / 1024 / 1024)}MB`);

async function memoryTest() {
  const iterations = 1000;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const startMemory = process.memoryUsage().heapUsed;
    
    await generateReport(testTemplate);
    
    const endMemory = process.memoryUsage().heapUsed;
    results.push(endMemory - startMemory);

    if (i % 100 === 0) {
      global.gc(); // Nécessite --expose-gc
      console.log(`Iteration ${i}: ${Math.round((endMemory - startMemory) / 1024)}KB`);
    }
  }

  // Analyser les résultats
  const average = results.reduce((a, b) => a + b, 0) / results.length;
  const max = Math.max(...results);
  const min = Math.min(...results);

  console.log(`
Memory Test Results:
-------------------
Average memory per report: ${Math.round(average / 1024)}KB
Maximum memory used: ${Math.round(max / 1024)}KB
Minimum memory used: ${Math.round(min / 1024)}KB
  `);
}

// Exécuter le test de mémoire si --memory est passé
if (process.argv.includes('--memory')) {
  memoryTest().catch(console.error);
}
