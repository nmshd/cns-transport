export class PercentCallback {
    private index = 0

    public constructor(private readonly callback: (percentage: number) => void, private readonly totalItems: number) {
        this.callback = callback
    }

    public increment(): void {
        this.index++
        this.sendProgess()
    }

    private sendProgess() {
        if (this.index === this.totalItems) return this.callback(100)

        if (this.index % 10 !== 0) return
        this.callback(Math.round((this.index / this.totalItems) * 100))
    }
}
