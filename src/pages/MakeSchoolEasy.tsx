import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const MakeSchoolEasy = () => {
  const isMobile = useIsMobile();

  const tools = [
    {
      name: "Perplexity Comet",
      url: "https://www.perplexity.ai/comet",
      description: "This is a cool new easy to use AI browser that was built by perplexity.",
      story: "I use it for some of my work and it really fun to mess around with. It is also quickly getting better and they even offered at one point to buy Chrome from Google haha. It is a cool idea, and I like how it can summarize your week or month of internet use... or not"
    },
    {
      name: "Gamma",
      url: "https://gamma.app/",
      description: "I used this for all of my presentation, it is a total game-changer",
      story: "You can have AI write out the content of your presentation and then dump it into gamma give it some prompts (like use real photos and not AI) or use these colors. Then you can quickly have it edit shorten or lengthen and then you have a beautiful slide deck. Tell your team that you will build the slide deck, use Gamma and it will be the easiest project ever."
    },
    {
      name: "Claude",
      url: "https://www.anthropic.com/",
      description: "I use it for all my writing and all of coding",
      story: "You can upload a sample of your previous writing or the A+ example that your teacher gave the class, and it will create a writing in that voice. Pretty incredible. Obviously don't submit this, but it can be very helpful of fleshing out ideas or creating them."
    },
    {
      name: "Grammarly",
      url: "https://www.grammarly.com/",
      description: "I use Grammarly for all the writing I do because it lets my quasi dyslexic focus on creating and not spelling.",
      story: "I also use it for my longer text messages of if I am struggling with a sentence in a paper it will give you longer, shorter, or more professional options."
    }
  ];

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-24' : ''}`}>
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
          Make School Easy
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Tools I use every day to make studying, writing, and presenting easier.
        </p>
      </div>

      {/* Tools Sections */}
      <div className="max-w-3xl mx-auto px-6 space-y-24 pb-24">
        {tools.map((tool, index) => (
          <article key={index} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {tool.name}
              </h2>
              <p className="text-xl text-foreground leading-relaxed">
                {tool.description}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {tool.story}
              </p>
            </div>
            
            <Button 
              asChild 
              size="lg"
              className="bg-usc-cardinal hover:bg-usc-cardinal/90 text-white"
            >
              <a 
                href={tool.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Try {tool.name}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </article>
        ))}
      </div>

      {/* Footer Note */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="border-t pt-8">
          <p className="text-sm text-muted-foreground text-center">
            These are independent tools that we recommend to help enhance your learning experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MakeSchoolEasy;