import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function HomeworkCard() {
  return (
    <Card className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">My homework</h3>
            <p className="text-sm opacity-90 mb-2">Unit 10.1</p>
            <p className="text-3xl font-bold">0%</p>
          </div>
          <Button variant="secondary" size="icon" className="bg-white/20 hover:bg-white/30 text-white">
            →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
