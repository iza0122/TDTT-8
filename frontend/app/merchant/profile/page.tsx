"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MerchantProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Restaurant Profile Management</h1>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>

        {/* General Info Tab */}
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update your restaurant's basic information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input id="name" placeholder="e.g., Delicious Bites" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slogan">Slogan</Label>
                <Input id="slogan" placeholder="e.g., Taste the Difference!" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="A short description of your restaurant..." rows={4} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cuisine">Cuisine Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="italian">Italian</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                    <SelectItem value="mexican">Mexican</SelectItem>
                    <SelectItem value="vietnamese">Vietnamese</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hours">Operating Hours</Label>
                <Input id="hours" placeholder="e.g., Mon-Fri: 10 AM - 10 PM" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Manage your restaurant's contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="e.g., 123 Main St, City, Country" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="e.g., +123 456 7890" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="e.g., info@restaurant.com" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Images</CardTitle>
              <CardDescription>Upload and manage your restaurant's photos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="avatar">Avatar Image</Label>
                <Input id="avatar" type="file" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hero">Hero Image</Label>
                <Input id="hero" type="file" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gallery">Gallery Images</Label>
                <Input id="gallery" type="file" multiple />
              </div>
              <Button>Upload Images</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Location</CardTitle>
              <CardDescription>Set your restaurant's coordinates for map integration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" placeholder="e.g., 34.0522" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" placeholder="e.g., -118.2437" />
              </div>
              <Button>Save Location</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
