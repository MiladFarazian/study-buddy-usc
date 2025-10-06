import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const MakeSchoolEasy = () => {
  const isMobile = useIsMobile();

  const tools = [
    {
      name: "Perplexity Comet",
      url: "https://www.perplexity.ai/comet",
      description: "AI browser built by Perplexity",
      features: [
        "Can summarize your week/month of internet usage",
        "Easy to use and constantly improving"
      ],
      gradient: "from-purple-500 to-pink-500"
    },
    {
      name: "Gamma",
      url: "https://gamma.app/",
      description: "AI-powered presentation builder",
      features: [
        "Creates beautiful slide decks from prompts",
        "Can edit, shorten, or lengthen presentations easily"
      ],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "Claude",
      url: "https://www.anthropic.com/",
      description: "AI writing and coding assistant",
      features: [
        "Can match your writing style from samples",
        "Helpful for brainstorming and idea development"
      ],
      gradient: "from-orange-500 to-red-500"
    },
    {
      name: "Grammarly",
      url: "https://www.grammarly.com/",
      description: "Writing and grammar checker",
      features: [
        "Offers sentence length and tone options",
        "Helps with spelling and professional writing"
      ],
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className={`${isMobile ? 'px-4 py-6 pb-24' : 'px-8 py-8'} max-w-7xl mx-auto`}>
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-usc-cardinal" />
          <h1 className="text-4xl font-bold text-usc-cardinal">Make School Easy</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover powerful tools to help you succeed in your studies. These AI-powered resources will save you time and improve your work.
        </p>
      </div>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-2'}`}>
        {tools.map((tool, index) => (
          <Card 
            key={index}
            className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-usc-cardinal"
          >
            <div className={`h-2 bg-gradient-to-r ${tool.gradient}`} />
            <CardHeader>
              <CardTitle className="text-2xl text-usc-cardinal flex items-center justify-between">
                {tool.name}
                <ExternalLink className="h-5 w-5" />
              </CardTitle>
              <CardDescription className="text-base font-medium">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {tool.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-usc-cardinal mt-1">•</span>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                asChild 
                className="w-full bg-usc-cardinal hover:bg-usc-cardinal/90"
              >
                <a 
                  href={tool.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  Try {tool.name}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className={`mt-12 p-6 bg-muted rounded-lg text-center ${isMobile ? 'mb-4' : ''}`}>
        <p className="text-sm text-muted-foreground">
          These are independent tools that we recommend to help enhance your learning experience. 
          Each tool offers its own unique features to support your academic success.
        </p>
      </div>
    </div>
  );
};

export default MakeSchoolEasy;