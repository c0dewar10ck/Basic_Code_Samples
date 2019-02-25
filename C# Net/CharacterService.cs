using DnDer.Api.Controllers;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace DnDer.Api.Services
{
    public class CharacterService
    {
        public CharacterService()
        {

        }

        public List<Character> GetPageByUser(int pageIndex, int pageSize, string userId)
        {
            using (var con = GetConnection())
            {
                var cmd = con.CreateCommand();

                cmd.CommandText = "Characters_SelectPageByUser";
                cmd.CommandType = System.Data.CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@PageIndex", pageIndex);
                cmd.Parameters.AddWithValue("@PageSize", pageSize);

                using (var reader = cmd.ExecuteReader())
                {
                    var chars = new List<Character>();

                    while (reader.Read())
                    {
                        var character = new Character
                        {
                            Id = (int)reader["Id"],
                            UserId = (string)reader["UserId"],
                            Name = (string)reader["Name"],
                            Race = reader["Race"] as string,
                            Class = reader["Class"] as string,
                            Level = (int)reader["Level"],
                            Background = reader["Background"] as string,
                            Alignment = reader["Alignment"] as string,
                            DateCreated = (DateTime)reader["DateCreated"],
                            DateModified = reader["DateModified"] as DateTime? ?? default(DateTime),
                            ModifiedBy = reader["ModifiedBy"] as string,
                        };

                        chars.Add(character);
                    }

                    return chars;
                }
            }

        }

        //helper method to create and open a database connection
        SqlConnection GetConnection()
        {
            var con = new SqlConnection(ConfigurationManager.ConnectionStrings["SQLServer"].ConnectionString);
            con.Open();
            return con;
        }
    }
}