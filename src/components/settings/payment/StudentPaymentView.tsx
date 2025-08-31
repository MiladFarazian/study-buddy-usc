import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const StudentPaymentView = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Payment History
            <Badge variant="outline">Payment Links</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your payment history will appear here. All payments are processed securely through Stripe checkout.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};