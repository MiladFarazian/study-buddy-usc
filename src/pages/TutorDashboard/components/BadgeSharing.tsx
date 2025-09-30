import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EarnedBadge } from '@/hooks/useTutorBadges';
import { BADGE_CONFIG } from '@/lib/badgeConfig';
import { ShareIcon, CopyIcon, TwitterIcon, LinkedinIcon, FacebookIcon, InstagramIcon, CheckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BadgeSharingProps {
  earnedBadges: EarnedBadge[];
}

export function BadgeSharing({ earnedBadges }: BadgeSharingProps) {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareText = (badgeType: string) => {
    const config = BADGE_CONFIG[badgeType];
    if (!config) return '';

    const baseMessage = `🎉 Just earned the "${config.name}" badge on TutorHub! ${config.icon}`;
    const customPart = customMessage ? `\n\n${customMessage}` : '';
    const hashtags = '\n\n#TutorHub #Achievement #Tutoring #Education';
    
    return `${baseMessage}${customPart}${hashtags}`;
  };

  const handleShare = async (platform: string, badgeType: string) => {
    const shareText = generateShareText(badgeType);
    const shareUrl = window.location.origin;

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      instagram: `https://www.instagram.com/` // Instagram doesn't support direct sharing
    };

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Copied to clipboard!",
          description: "Your achievement message has been copied.",
        });
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Please copy the text manually.",
          variant: "destructive"
        });
      }
      return;
    }

    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
    }
  };

  const getRarityGradient = (badgeType: string) => {
    const config = BADGE_CONFIG[badgeType];
    if (!config) return 'from-gray-400 to-gray-600';

    switch (config.rarity) {
      case 'legendary':
        return 'from-red-700 to-red-900';
      case 'epic':
        return 'from-amber-400 to-amber-600';
      case 'rare':
        return 'from-slate-400 to-slate-600';
      case 'uncommon':
        return 'from-purple-500 to-purple-700';
      default:
        return 'from-sky-300 to-sky-400';
    }
  };

  if (earnedBadges.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ShareIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No Badges to Share Yet
          </h3>
          <p className="text-muted-foreground">
            Earn your first badge to start sharing your achievements!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Share Your Achievements</h2>
        <p className="text-muted-foreground">
          Celebrate your success and inspire others by sharing your badges
        </p>
      </div>

      {/* Badge Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select a Badge to Share</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {earnedBadges.map((badge) => {
              const config = BADGE_CONFIG[badge.badge_type];
              if (!config) return null;

              const isSelected = selectedBadge === badge.badge_type;

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge.badge_type)}
                  className={`
                    p-6 rounded-lg bg-white dark:bg-gray-900 transition-all
                    ${isSelected 
                      ? 'ring-2 ring-primary shadow-lg scale-105' 
                      : 'hover:shadow-md hover:scale-102'
                    }
                  `}
                >
                  <div className={`
                    w-20 h-20 mx-auto mb-4 rounded-full 
                    bg-gradient-to-br ${getRarityGradient(badge.badge_type)}
                    flex items-center justify-center text-3xl text-white shadow-md
                  `}>
                    {config.icon}
                  </div>
                  <h3 className="font-semibold text-sm text-center mb-2 line-clamp-2 min-h-[2.5rem]">
                    {config.name.split(':')[0]}
                  </h3>
                  <div className="text-xs text-muted-foreground text-center">
                    {config.rarity}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Share Interface */}
      {selectedBadge && (
        <Card>
          <CardHeader>
            <CardTitle>Customize Your Share Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Preview:</h4>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <div className="whitespace-pre-line text-sm">
                  {generateShareText(selectedBadge)}
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Add Your Personal Message (Optional)
              </label>
              <Textarea
                placeholder="Add a personal note about your achievement..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Share Buttons */}
            <div className="space-y-4">
              <h4 className="font-medium">Share On:</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Button
                  onClick={() => handleShare('twitter', selectedBadge)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <TwitterIcon className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                
                <Button
                  onClick={() => handleShare('linkedin', selectedBadge)}
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                >
                  <LinkedinIcon className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
                
                <Button
                  onClick={() => handleShare('facebook', selectedBadge)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FacebookIcon className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                
                <Button
                  onClick={() => handleShare('instagram', selectedBadge)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <InstagramIcon className="w-4 h-4 mr-2" />
                  Instagram
                </Button>
                
                <Button
                  onClick={() => handleShare('copy', selectedBadge)}
                  variant="outline"
                  className="relative"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4 mr-2" />
                      Copy Text
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Share Tips */}
            <Card className="bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
                  💡 Sharing Tips
                </h4>
                <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                  <li>• Tag relevant educational institutions or communities</li>
                  <li>• Share during peak hours for maximum engagement</li>
                  <li>• Add relevant hashtags to reach a wider audience</li>
                  <li>• Consider creating a LinkedIn article about your tutoring journey</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Achievement Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Your Achievement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {earnedBadges.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Badges</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">
                {earnedBadges.filter(badge => {
                  const config = BADGE_CONFIG[badge.badge_type];
                  return config?.rarity === 'rare' || config?.rarity === 'epic' || config?.rarity === 'legendary';
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Rare+ Badges</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                {earnedBadges.length > 0 ? 
                  Math.round((earnedBadges.length / Object.keys(BADGE_CONFIG).length) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Collection Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}