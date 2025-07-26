import React, { useState } from 'react';
import { Mail, Lock, Send, Heart, Check } from 'lucide-react';
import { Button, Card, CardHeader, CardBody, CardFooter, Input, Modal, ModalHeader, ModalBody, ModalFooter } from './index';

const DesignSystemDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="container py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gradient-primary mb-2">
          GenCare Design System
        </h1>
        <p className="text-gray-600">
          Hệ thống thiết kế nhất quán cho ứng dụng GenCare
        </p>
      </div>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Buttons</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Button Variants */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Sizes</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="base">Base</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            {/* Button States */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">States</h3>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button leftIcon={<Heart className="w-4 h-4" />}>With Icon</Button>
                <Button rightIcon={<Send className="w-4 h-4" />}>Send</Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Cards Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Cards</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card hover={false}>
              <CardHeader>
                <h3 className="text-lg font-medium">Simple Card</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600">
                  This is a simple card with header and body.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Interactive Card</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600">
                  This card has hover effects enabled.
                </p>
              </CardBody>
              <CardFooter>
                <Button size="sm" variant="outline">Learn More</Button>
              </CardFooter>
            </Card>

            <Card className="gradient-primary-light border-0">
              <CardHeader>
                <h3 className="text-lg font-medium text-primary">Featured Card</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700">
                  This card uses gradient background.
                </p>
              </CardBody>
            </Card>
          </div>
        </CardBody>
      </Card>

      {/* Inputs Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Inputs</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4 max-w-md">
            <Input
              label="Email"
              type="email"
              placeholder="Nhập email của bạn"
              leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="Nhập mật khẩu"
              leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
            />
            
            <Input
              label="Error State"
              type="text"
              placeholder="Input with error"
              error="This field is required"
            />
            
            <Input
              label="Disabled Input"
              type="text"
              placeholder="Disabled input"
              disabled
            />
          </div>
        </CardBody>
      </Card>

      {/* Modal Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Modal</h2>
        </CardHeader>
        <CardBody>
          <Button onClick={() => setShowModal(true)}>
            Open Modal
          </Button>
        </CardBody>
      </Card>

      {/* Typography Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Typography</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Heading 1</h1>
              <h2 className="text-2xl font-semibold">Heading 2</h2>
              <h3 className="text-xl font-medium">Heading 3</h3>
              <h4 className="text-lg font-medium">Heading 4</h4>
            </div>
            
            <div>
              <p className="text-base text-gray-900">
                This is a regular paragraph with <strong>bold text</strong> and <em>italic text</em>.
              </p>
              <p className="text-sm text-gray-600">
                This is smaller text, often used for descriptions.
              </p>
              <p className="text-xs text-gray-500">
                This is very small text, used for captions or fine print.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Colors</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 gradient-primary rounded-lg mx-auto mb-2"></div>
              <p className="text-sm">Primary</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 gradient-accent rounded-lg mx-auto mb-2"></div>
              <p className="text-sm">Accent</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500 rounded-lg mx-auto mb-2"></div>
              <p className="text-sm">Gray</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 gradient-hero rounded-lg mx-auto mb-2"></div>
              <p className="text-sm">Hero</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Demo Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalHeader onClose={() => setShowModal(false)}>
          <h3 className="text-lg font-semibold">Demo Modal</h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-600">
            This is a demo modal using the design system components.
            It includes proper spacing, typography, and interaction patterns.
          </p>
          <div className="mt-4">
            <Input
              label="Sample Input"
              placeholder="Type something..."
              leftIcon={<Check className="w-4 h-4 text-gray-400" />}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => setShowModal(false)}>
            Confirm
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default DesignSystemDemo; 