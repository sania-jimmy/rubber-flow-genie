import { Product, ScheduledProduct, ProductionSchedule, DailySchedule } from "@/types/production";

interface Chromosome {
  order: number[];
  fitness: number;
}

export class GeneticAlgorithmScheduler {
  private populationSize = 100;
  private generations = 200;
  private mutationRate = 0.1;
  private crossoverRate = 0.7;
  private elitismRate = 0.1;

  constructor(
    private products: Product[],
    private workingHoursPerDay: number
  ) {}

  public optimize(): ProductionSchedule {
    let population = this.initializePopulation();

    for (let gen = 0; gen < this.generations; gen++) {
      population = population.map(chromosome => ({
        ...chromosome,
        fitness: this.calculateFitness(chromosome.order)
      }));

      population.sort((a, b) => b.fitness - a.fitness);

      const newPopulation: Chromosome[] = [];
      const eliteCount = Math.floor(this.populationSize * this.elitismRate);
      
      // Keep elite chromosomes
      for (let i = 0; i < eliteCount; i++) {
        newPopulation.push({ ...population[i] });
      }

      // Create new generation
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.tournamentSelection(population);
        const parent2 = this.tournamentSelection(population);

        let offspring: number[];
        if (Math.random() < this.crossoverRate) {
          offspring = this.crossover(parent1.order, parent2.order);
        } else {
          offspring = [...parent1.order];
        }

        if (Math.random() < this.mutationRate) {
          offspring = this.mutate(offspring);
        }

        newPopulation.push({
          order: offspring,
          fitness: this.calculateFitness(offspring)
        });
      }

      population = newPopulation;
    }

    population.sort((a, b) => b.fitness - a.fitness);
    return this.createSchedule(population[0].order);
  }

  private initializePopulation(): Chromosome[] {
    const population: Chromosome[] = [];
    const baseOrder = this.products.map((_, i) => i);

    for (let i = 0; i < this.populationSize; i++) {
      const order = [...baseOrder];
      // Shuffle array
      for (let j = order.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [order[j], order[k]] = [order[k], order[j]];
      }
      population.push({
        order,
        fitness: this.calculateFitness(order)
      });
    }

    return population;
  }

  private calculateFitness(order: number[]): number {
    let fitness = 10000;
    let currentDay = 0;

    for (const productIndex of order) {
      const product = this.products[productIndex];
      const piecesPerDay = this.workingHoursPerDay / product.processingTimePerUnit;
      const daysRequired = Math.ceil(product.count / piecesPerDay);
      const completionDay = currentDay + daysRequired;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntilDeadline = Math.floor(
        (product.requirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const delay = Math.max(0, completionDay - daysUntilDeadline);
      
      // Heavy penalty for delays
      fitness -= delay * 100;
      
      // Penalty for total days
      fitness -= completionDay * 2;

      // Bonus for completing early
      if (delay === 0) {
        fitness += 50;
      }

      currentDay = completionDay;
    }

    return fitness;
  }

  private tournamentSelection(population: Chromosome[]): Chromosome {
    const tournamentSize = 5;
    let best = population[Math.floor(Math.random() * population.length)];

    for (let i = 1; i < tournamentSize; i++) {
      const competitor = population[Math.floor(Math.random() * population.length)];
      if (competitor.fitness > best.fitness) {
        best = competitor;
      }
    }

    return best;
  }

  private crossover(parent1: number[], parent2: number[]): number[] {
    const size = parent1.length;
    const start = Math.floor(Math.random() * size);
    const end = Math.floor(Math.random() * (size - start)) + start;

    const offspring = new Array(size).fill(-1);
    
    // Copy segment from parent1
    for (let i = start; i <= end; i++) {
      offspring[i] = parent1[i];
    }

    // Fill remaining from parent2
    let currentIndex = 0;
    for (let i = 0; i < size; i++) {
      if (currentIndex === start) {
        currentIndex = end + 1;
      }
      if (currentIndex >= size) break;

      if (!offspring.includes(parent2[i])) {
        offspring[currentIndex] = parent2[i];
        currentIndex++;
      }
    }

    return offspring;
  }

  private mutate(order: number[]): number[] {
    const mutated = [...order];
    const i = Math.floor(Math.random() * mutated.length);
    const j = Math.floor(Math.random() * mutated.length);
    [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    return mutated;
  }

  private createSchedule(order: number[]): ProductionSchedule {
    const scheduledProducts: ScheduledProduct[] = [];
    const dailySchedule: DailySchedule[] = [];
    let currentDay = 0;
    let currentDayHours = 0; // Track hours used in current day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < order.length; i++) {
      const productIndex = order[i];
      const product = this.products[productIndex];
      
      const startDay = currentDay;
      let remainingPieces = product.count;
      let totalDaysRequired = 0;
      let productStartDay = currentDay;
      
      // Schedule this product starting from current day/hour
      while (remainingPieces > 0) {
        // Initialize day if needed
        if (!dailySchedule[currentDay]) {
          const date = new Date(today);
          date.setDate(date.getDate() + currentDay);
          dailySchedule[currentDay] = {
            day: currentDay + 1,
            date,
            products: [],
            totalHoursUsed: 0
          };
        }

        // Calculate how many pieces can fit in remaining hours today
        const availableHours = this.workingHoursPerDay - currentDayHours;
        const piecesCanFitToday = Math.floor(availableHours / product.processingTimePerUnit);
        const piecesToday = Math.min(remainingPieces, Math.max(1, piecesCanFitToday));
        const hoursUsed = piecesToday * product.processingTimePerUnit;

        // Add to daily schedule
        dailySchedule[currentDay].products.push({
          productId: product.id,
          productName: product.name,
          pieces: piecesToday,
          hoursUsed
        });
        dailySchedule[currentDay].totalHoursUsed += hoursUsed;

        remainingPieces -= piecesToday;
        currentDayHours += hoursUsed;
        totalDaysRequired++;

        // Move to next day if current day is full or nearly full
        if (currentDayHours >= this.workingHoursPerDay - 0.01 && remainingPieces > 0) {
          currentDay++;
          currentDayHours = 0;
        }
      }

      // Calculate average pieces per day for display
      const piecesPerDay = Math.floor(product.count / totalDaysRequired);
      
      const daysUntilDeadline = Math.floor(
        (product.requirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const completionDay = currentDayHours > 0 ? currentDay + 1 : currentDay;
      const extraDays = Math.max(0, completionDay - daysUntilDeadline);

      scheduledProducts.push({
        ...product,
        startDay: productStartDay,
        totalDaysRequired,
        piecesPerDay,
        extraDays,
        productionOrder: i + 1
      });
    }

    // Calculate total days (if last day has any hours used, count it)
    const totalDays = currentDayHours > 0 ? currentDay + 1 : currentDay;

    return {
      products: scheduledProducts,
      totalDays,
      dailySchedule: dailySchedule.filter(d => d !== undefined)
    };
  }
}
