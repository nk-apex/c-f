import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Lock, Hash } from "lucide-react";
import type { BotCommand } from "@shared/schema";

const categoryColors: Record<string, string> = {
  ai: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  automation: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  creative: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  downloaders: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  fun: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  games: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  general: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  group: "bg-green-500/10 text-green-600 dark:text-green-400",
  media: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  menus: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  religious: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  search: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  system: "bg-red-500/10 text-red-600 dark:text-red-400",
  text: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  tools: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

export function CommandsPanel({
  commands,
  prefix,
}: {
  commands: BotCommand[];
  prefix: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats: Record<string, BotCommand[]> = {};
    for (const cmd of commands) {
      const cat = cmd.category || "uncategorized";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(cmd);
    }
    return cats;
  }, [commands]);

  const filteredCommands = useMemo(() => {
    let cmds = commands;
    if (selectedCategory) {
      cmds = cmds.filter((c) => c.category === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      cmds = cmds.filter(
        (c) =>
          c.name.includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.alias.some((a) => a.includes(q))
      );
    }
    return cmds;
  }, [commands, search, selectedCategory]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search-commands"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Hash className="w-3.5 h-3.5" />
          {commands.length} commands
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge
          data-testid="filter-all"
          variant={selectedCategory === null ? "default" : "secondary"}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        {Object.keys(categories)
          .sort()
          .map((cat) => (
            <Badge
              key={cat}
              data-testid={`filter-${cat}`}
              variant={selectedCategory === cat ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            >
              {cat} ({categories[cat].length})
            </Badge>
          ))}
      </div>

      {filteredCommands.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No commands found matching your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCommands.map((cmd) => (
            <Card key={cmd.name} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-[10px] font-bold ${
                        categoryColors[cmd.category] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {cmd.category.charAt(0).toUpperCase()}
                    </span>
                    <code className="text-sm font-mono font-semibold" data-testid={`text-cmd-${cmd.name}`}>
                      {prefix}{cmd.name}
                    </code>
                  </div>
                  {cmd.ownerOnly && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {cmd.description}
                </p>
                {cmd.alias.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {cmd.alias.slice(0, 3).map((a) => (
                      <Badge key={a} variant="secondary" className="text-[10px]">
                        {a}
                      </Badge>
                    ))}
                    {cmd.alias.length > 3 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{cmd.alias.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
