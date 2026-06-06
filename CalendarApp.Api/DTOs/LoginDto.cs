using System.ComponentModel.DataAnnotations;

namespace CalendarApp.Api.DTOs;

public class LoginDto
{
    [Required(ErrorMessage = "Email обязателен для заполнения")]
    [EmailAddress(ErrorMessage = "Некорректный формат Email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Пароль обязателен для заполнения")]
    public string Password { get; set; } = string.Empty;
}