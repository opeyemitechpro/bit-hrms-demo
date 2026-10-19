<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;

class ResetPasswordNotification extends ResetPassword
{
    protected function resetUrl($notifiable)
    {
        return rtrim(config('app.url'), '/') . '/?' . http_build_query([
            'reset_token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
    }
}