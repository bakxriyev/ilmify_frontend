export function LibrarySection() {
  const libraryItems = [
    { title: "Podcasts", description: "Listen over 250 podcasts", icon: "🎧" },
    { title: "Videos", description: "Watch over 250 videos", icon: "📹" },
    { title: "Books", description: "Read over 250 books", icon: "📚" },
  ]

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-blue-900 mb-4">Library</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {libraryItems.map((item) => (
          <div key={item.title} className="bg-white rounded-lg p-6 text-center shadow-sm border border-blue-100">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold mb-2 text-blue-900">{item.title}</h3>
            <p className="text-sm text-blue-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
