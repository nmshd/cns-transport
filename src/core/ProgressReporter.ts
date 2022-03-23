export class ProgressReporter<T extends string> {
    private readonly steps: Record<string, ProgressReporterStep<T> | undefined> = {}

    public constructor(private readonly callback: (currentPercentage: number, currentStep: T) => void) {}

    public newStep(stepName: T, totalNumberOfItemsInStep = -1): ProgressReporterStep<T> {
        return this.addNewStep(stepName, totalNumberOfItemsInStep)
    }

    public getStep(stepName: T): ProgressReporterStep<T> {
        const step = this.steps[stepName]
        if (!step) {
            throw new Error(
                `No step with name '${stepName}' was found. Create the step using 'newStelp()' or 'step()'.`
            )
        }

        return step
    }

    public step(stepName: T, totalNumberOfItemsInStep?: number): ProgressReporterStep<T> {
        const step = this.steps[stepName]
        if (step) return step
        if (!totalNumberOfItemsInStep) {
            throw new Error(
                `No step with name '${stepName}' was found and parameter 'totalNumberOfItemsInStep' was not provided => cannot create a new step`
            )
        }
        return this.addNewStep(stepName, totalNumberOfItemsInStep)
    }

    private addNewStep(step: T, totalNumberOfItemsInStep: number) {
        const newStep = new ProgressReporterStep(step, totalNumberOfItemsInStep, this.callback)
        this.steps[step] = newStep
        return newStep
    }
}
export class ProgressReporterStep<T extends string> {
    private currentItem: number
    public constructor(
        public readonly name: T,
        private totalNumberOfItems: number,
        private readonly callback: (currentPercentage: number, currentStep: T) => void
    ) {
        if (totalNumberOfItems > 0) this.progressTo(0)
    }

    public progress(): void {
        this.progressTo(this.currentItem + 1)
    }

    public progressTo(itemIndex: number): void {
        this.currentItem = itemIndex
        this.callback(Math.round((itemIndex / this.totalNumberOfItems) * 100), this.name)
    }

    public incrementTotalNumberOfItems(): void {
        this.updateTotalNumberOfItems(this.totalNumberOfItems + 1)
    }

    public updateTotalNumberOfItems(newValue: number): void {
        this.totalNumberOfItems = newValue
    }

    public finish(): void {
        this.progressTo(this.totalNumberOfItems)
    }

    public finishIfNotFinished(): void {
        if (this.currentItem < this.totalNumberOfItems) this.finish()
    }

    public manualReport(percentage: number): void {
        this.callback(percentage, this.name)
    }
}
